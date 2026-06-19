import { Router, Request, Response } from "express"
import {
  listContainers,
  getContainerStats,
  restartContainer,
  stopContainer,
  startContainer,
  deployContainer,
  getContainerLogs,
  isDockerReachable,
} from "../services/docker.js"
import { mockContainers, mockContainerStats } from "../data/mock.js"

const router = Router()

router.get("/containers", async (_req: Request, res: Response) => {
  try {
    if (await isDockerReachable()) {
      const [containers, stats] = await Promise.all([listContainers(true), getContainerStats()])
      return res.json({ success: true, data: { containers, summary: stats }, timestamp: new Date().toISOString() })
    }
  } catch (err) {
    console.warn("[Docker] Falling back to mock data:", (err as Error).message)
  }
  res.json({ success: true, data: { containers: mockContainers, summary: mockContainerStats }, timestamp: new Date().toISOString() })
})

router.post("/containers/deploy", async (req: Request, res: Response) => {
  const { image, name, ports, env } = req.body
  if (!image) return res.status(400).json({ success: false, error: "Image name is required" })
  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { id: "sim", name: name || `devi-${image.replace(/[^a-z0-9]/g, "-")}`, message: `Simulated: container from "${image}" deployed (Docker unavailable)` }, timestamp: new Date().toISOString() })
  }
  try {
    const result = await deployContainer(image, name, ports, env)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    console.warn(`[Docker] Deploy fallback to mock: ${err.message}`)
    res.json({ success: true, data: { id: "sim", name: name || `devi-${image.replace(/[^a-z0-9]/g, "-")}`, message: `Simulated: container from "${image}" deployed (image unavailable locally)` }, timestamp: new Date().toISOString() })
  }
})

router.get("/containers/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string
  try {
    if (await isDockerReachable()) {
      const containers = await listContainers(true)
      const container = containers.find((c) => c.id.startsWith(id) || c.name === id)
      if (!container) return res.status(404).json({ success: false, error: "Container not found" })
      return res.json({ success: true, data: container, timestamp: new Date().toISOString() })
    }
  } catch (err) {
    console.warn("[Docker] Falling back to mock data:", (err as Error).message)
  }
  const mock = mockContainers.find((c) => c.name === id)
  if (!mock) return res.status(404).json({ success: false, error: "Container not found" })
  res.json({ success: true, data: mock, timestamp: new Date().toISOString() })
})

router.post("/containers/:id/restart", async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { message: `Simulated: "${id}" restarted (Docker unavailable)` }, timestamp: new Date().toISOString() })
  }
  try {
    const result = await restartContainer(id)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    const msg = err.statusCode === 404 ? "Container not found" : err.message || "Failed to restart container"
    const status = err.statusCode === 404 ? 404 : 500
    res.status(status).json({ success: false, error: msg })
  }
})

router.post("/containers/:id/stop", async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { message: `Simulated: "${id}" stopped (Docker unavailable)` }, timestamp: new Date().toISOString() })
  }
  try {
    const result = await stopContainer(id)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    const msg = err.statusCode === 404 ? "Container not found" : err.message || "Failed to stop container"
    const status = err.statusCode === 404 ? 404 : 500
    res.status(status).json({ success: false, error: msg })
  }
})

router.post("/containers/:id/start", async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { message: `Simulated: "${id}" started (Docker unavailable)` }, timestamp: new Date().toISOString() })
  }
  try {
    const result = await startContainer(id)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    const msg = err.statusCode === 404 ? "Container not found" : err.message || "Failed to start container"
    const status = err.statusCode === 404 ? 404 : 500
    res.status(status).json({ success: false, error: msg })
  }
})

router.get("/containers/:id/logs", async (req: Request, res: Response) => {
  const id = req.params.id as string
  const tail = Math.min(Math.max(parseInt(req.query.tail as string) || 100, 1), 5000)
  if (!(await isDockerReachable())) {
    return res.json({ success: true, data: { source: id, lines: [], total: 0, message: "Docker unavailable — mock log data" }, timestamp: new Date().toISOString() })
  }
  try {
    const logs = await getContainerLogs(id, tail)
    res.json({ success: true, data: { source: id, lines: logs, total: logs.length }, timestamp: new Date().toISOString() })
  } catch (err: any) {
    const msg = err.statusCode === 404 ? "Container not found" : err.message || "Failed to fetch logs"
    const status = err.statusCode === 404 ? 404 : 500
    res.status(status).json({ success: false, error: msg })
  }
})

export default router
