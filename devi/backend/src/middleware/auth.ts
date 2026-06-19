import { Request, Response, NextFunction } from "express"
import { verifyToken, User } from "../services/auth.js"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication required" })
  }

  const token = header.slice(7)
  const user = verifyToken(token)
  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" })
  }

  req.user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Authentication required" })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Requires one of roles: ${roles.join(", ")}` })
    }
    next()
  }
}
