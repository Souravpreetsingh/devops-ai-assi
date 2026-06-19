import { Router } from "express"
import { executeCommand, validateCommand, ShellExecutionError } from "../services/shell.js"

const router = Router()

router.post("/execute", async (req, res) => {
  const { command } = req.body
  if (!command || typeof command !== "string") {
    return res.status(400).json({ success: false, error: "command field is required" })
  }

  const validation = validateCommand(command)
  if (!validation.valid) {
    return res.status(403).json({ success: false, error: validation.error })
  }

  try {
    const result = await executeCommand(command)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err) {
    if (err instanceof ShellExecutionError) {
      return res.status(400).json({ success: false, error: err.message })
    }
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post("/validate", (req, res) => {
  const { command } = req.body
  if (!command || typeof command !== "string") {
    return res.status(400).json({ success: false, error: "command field is required" })
  }
  res.json({ success: true, data: validateCommand(command) })
})

export default router
