import { Router } from "express"
import crypto from "crypto"
import { processMessage } from "../services/ai.js"

const router = Router()

router.post("/chat", async (req, res) => {
  const { message, conversationId } = req.body
  if (!message || typeof message !== "string") {
    return res.status(400).json({ success: false, error: "message field is required" })
  }

  try {
    const reply = await processMessage(message)

    res.json({
      success: true,
      data: {
        conversationId: conversationId || crypto.randomUUID(),
        reply,
        suggestions: [
          "Show cluster health",
          "Restart api-gateway container",
          "Scale web-frontend to 3 replicas",
          "Analyze payment-worker logs",
        ],
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "AI processing failed" })
  }
})

router.get("/history", (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: crypto.randomUUID(), title: "K8s Cluster Analysis", messageCount: 4, lastActive: new Date(Date.now() - 3600000).toISOString() },
      { id: crypto.randomUUID(), title: "Redis Performance Review", messageCount: 7, lastActive: new Date(Date.now() - 7200000).toISOString() },
      { id: crypto.randomUUID(), title: "Deployment Rollback", messageCount: 3, lastActive: new Date(Date.now() - 86400000).toISOString() },
    ],
    timestamp: new Date().toISOString(),
  })
})

export default router
