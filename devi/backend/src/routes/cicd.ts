import { Router } from "express"
import { createDeployment, rollbackDeployment, getDeployments, getPipelineRuns, createPipelineRun, getHistory, addCommandHistory } from "../services/cicd.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router()

router.get("/deployments", requireAuth, (_req, res) => {
  res.json({ success: true, data: getDeployments(), timestamp: new Date().toISOString() })
})

router.post("/deployments", requireAuth, (req, res) => {
  const { service, version, type, strategy, replicas, imageTag } = req.body
  if (!service || !version) return res.status(400).json({ success: false, error: "Service and version required" })

  const dep = createDeployment(
    service,
    version,
    type || "backend",
    strategy || "rolling",
    replicas || 2,
    imageTag || `v${version}`,
    req.user?.username || "system",
  )
  res.json({ success: true, data: dep, timestamp: new Date().toISOString() })
})

router.post("/deployments/:id/rollback", requireAuth, (req, res) => {
  const dep = rollbackDeployment(req.params.id as string, req.user?.username || "system")
  if (!dep) return res.status(404).json({ success: false, error: "Deployment not found" })
  res.json({ success: true, data: dep, timestamp: new Date().toISOString() })
})

router.get("/pipelines", requireAuth, (_req, res) => {
  res.json({ success: true, data: getPipelineRuns(), timestamp: new Date().toISOString() })
})

router.post("/pipelines", requireAuth, (req, res) => {
  const { pipeline, steps } = req.body
  if (!pipeline || !steps) return res.status(400).json({ success: false, error: "Pipeline name and steps required" })

  const run = createPipelineRun(pipeline, steps)
  res.json({ success: true, data: run, timestamp: new Date().toISOString() })
})

router.get("/history", requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  res.json({ success: true, data: getHistory(limit), timestamp: new Date().toISOString() })
})

router.post("/command", requireAuth, (req, res) => {
  const { command, status } = req.body
  if (!command) return res.status(400).json({ success: false, error: "Command required" })
  addCommandHistory(command, req.user?.username || "system", status || "success")
  res.json({ success: true, data: { message: "Command logged" }, timestamp: new Date().toISOString() })
})

export default router
