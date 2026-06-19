import { Router } from "express"
import { remember, getSessionMemory, getAllMemory, getContextSummary, generateSuggestions } from "../services/memory.js"
import { detectAnomalies, generateAnomalyResponse, Anomaly } from "../services/agent.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router()

router.post("/remember", requireAuth, (req, res) => {
  const { sessionId, type, content, metadata } = req.body
  if (!sessionId || !type || !content) return res.status(400).json({ success: false, error: "sessionId, type, and content required" })
  const memory = remember(sessionId, type, content, metadata)
  res.json({ success: true, data: memory, timestamp: new Date().toISOString() })
})

router.get("/memory", requireAuth, (req, res) => {
  const { sessionId, type } = req.query
  if (sessionId) {
    return res.json({ success: true, data: getSessionMemory(sessionId as string), timestamp: new Date().toISOString() })
  }
  res.json({ success: true, data: getAllMemory(type as any), timestamp: new Date().toISOString() })
})

router.get("/context", requireAuth, (req, res) => {
  const { sessionId } = req.query
  if (!sessionId) return res.status(400).json({ success: false, error: "sessionId required" })
  const summary = getContextSummary(sessionId as string)
  res.json({ success: true, data: { summary }, timestamp: new Date().toISOString() })
})

router.post("/suggestions", requireAuth, (req, res) => {
  const { sessionId, context } = req.body
  const suggestions = generateSuggestions(sessionId || "default", context || {})
  res.json({ success: true, data: suggestions, timestamp: new Date().toISOString() })
})

router.post("/anomalies", requireAuth, (req, res) => {
  const { service, metrics } = req.body
  if (!service || !metrics) return res.status(400).json({ success: false, error: "service and metrics required" })
  const anomalies = detectAnomalies(service, metrics)
  const response = generateAnomalyResponse(anomalies)
  res.json({ success: true, data: { anomalies, response }, timestamp: new Date().toISOString() })
})

export default router
