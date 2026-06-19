import { Router } from "express"
import { authenticate, refreshAccessToken, revokeRefreshToken, seedDefaultUser, getUsers, createUser, User } from "../services/auth.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

const router = Router()

router.post("/login", async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password required" })
  }

  const result = await authenticate(username, password)
  if (!result) {
    return res.status(401).json({ success: false, error: "Invalid credentials" })
  }

  res.json({ success: true, data: result, timestamp: new Date().toISOString() })
})

router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ success: false, error: "Refresh token required" })

  const result = refreshAccessToken(refreshToken)
  if (!result) return res.status(401).json({ success: false, error: "Invalid or expired refresh token" })

  res.json({ success: true, data: { token: result.token, user: result.user }, timestamp: new Date().toISOString() })
})

router.post("/logout", (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) revokeRefreshToken(refreshToken)
  res.json({ success: true, data: { message: "Logged out" }, timestamp: new Date().toISOString() })
})

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: req.user, timestamp: new Date().toISOString() })
})

router.get("/users", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ success: true, data: getUsers(), timestamp: new Date().toISOString() })
})

router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { username, password, role } = req.body
  if (!username || !password) return res.status(400).json({ success: false, error: "Username and password required" })
  if (!["admin", "operator", "viewer"].includes(role)) return res.status(400).json({ success: false, error: "Role must be admin, operator, or viewer" })

  const user = await createUser(username, password, role as User["role"])
  res.json({ success: true, data: user, timestamp: new Date().toISOString() })
})

export default router
