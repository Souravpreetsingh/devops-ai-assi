import { Router } from "express"
import { mockLogSources, generateLogLines } from "../data/mock.js"

const router = Router()

router.get("/", (req, res) => {
  const source = (req.query.source as string) || "api-gateway"
  const lines = Math.min(Math.max(parseInt(req.query.lines as string) || 50, 1), 500)
  res.json({
    success: true,
    data: {
      source,
      lines: generateLogLines(source, lines),
      total: lines,
    },
    sources: mockLogSources,
    timestamp: new Date().toISOString(),
  })
})

router.get("/sources", (_req, res) => {
  res.json({
    success: true,
    data: mockLogSources,
    timestamp: new Date().toISOString(),
  })
})

export default router
