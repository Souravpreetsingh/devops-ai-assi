import { Router } from "express"
import { getSystemStats } from "../services/system.js"

const router = Router()

router.get("/stats", async (_req, res) => {
  try {
    const stats = await getSystemStats()
    res.json({ success: true, data: stats, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
