import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "devi-dev-secret-change-in-production"
const REFRESH_SECRET = process.env.REFRESH_SECRET || "devi-refresh-secret-change-in-production"
const TOKEN_EXPIRY = "24h"
const REFRESH_EXPIRY = "7d"

export interface User {
  id: string
  username: string
  role: "admin" | "operator" | "viewer"
}

interface RefreshToken {
  token: string
  userId: string
  expiresAt: Date
}

const USERS: { username: string; passwordHash: string; role: User["role"]; id: string }[] = []
const refreshTokens: RefreshToken[] = []

export async function seedDefaultUser() {
  if (USERS.length === 0) {
    const hash = await bcrypt.hash("admin123", 10)
    USERS.push({ username: "admin", passwordHash: hash, role: "admin", id: crypto.randomUUID() })
    console.log("[Auth] Default user created: admin / admin123")
  }
}

export async function authenticate(username: string, password: string): Promise<{ user: User; token: string; refreshToken: string } | null> {
  const user = USERS.find((u) => u.username === username)
  if (!user) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
  const refreshToken = crypto.randomUUID()

  refreshTokens.push({ token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) })

  return { user: { id: user.id, username: user.username, role: user.role }, token, refreshToken }
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return { id: decoded.id, username: decoded.username, role: decoded.role }
  } catch {
    return null
  }
}

export function refreshAccessToken(refreshToken: string): { token: string; user: User } | null {
  const stored = refreshTokens.find((rt) => rt.token === refreshToken && rt.expiresAt > new Date())
  if (!stored) return null

  const user = USERS.find((u) => u.id === stored.userId)
  if (!user) return null

  const newToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
  return { token: newToken, user: { id: user.id, username: user.username, role: user.role } }
}

export function revokeRefreshToken(token: string) {
  const idx = refreshTokens.findIndex((rt) => rt.token === token)
  if (idx >= 0) refreshTokens.splice(idx, 1)
}

export function getUsers(): User[] {
  return USERS.map((u) => ({ id: u.id, username: u.username, role: u.role }))
}

export async function createUser(username: string, password: string, role: User["role"]): Promise<User> {
  const hash = await bcrypt.hash(password, 10)
  const id = crypto.randomUUID()
  USERS.push({ username, passwordHash: hash, role, id })
  return { id, username, role }
}
