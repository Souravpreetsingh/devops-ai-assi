import { Router, Request, Response } from "express"
import {
  getPods,
  getNodes,
  getDeployments,
  restartDeployment,
  scaleDeployment,
  deletePod,
  getPodYaml,
  getPodLogs,
  getNamespaces,
  getClusterHealth,
  isK8sReachable,
  validateResourceName,
  validateNamespace,
  validateReplicas,
} from "../services/kubernetes.js"
import { mockPods, mockPodSummary } from "../data/mock.js"

const router = Router()

router.get("/pods", async (req: Request, res: Response) => {
  const namespace = req.query.namespace as string | undefined
  try {
    if (await isK8sReachable()) {
      const result = await getPods(namespace || undefined)
      return res.json({
        success: true,
        data: { pods: result.pods, summary: result },
        timestamp: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn("[K8s] Falling back to mock data:", (err as Error).message)
  }
  const filtered = namespace ? mockPods.filter((p) => p.namespace === namespace) : mockPods
  res.json({
    success: true,
    data: {
      pods: filtered,
      summary: {
        total: filtered.length,
        running: filtered.filter((p) => p.status === "Running").length,
        pending: filtered.filter((p) => p.status === "Pending").length,
        failed: filtered.filter((p) => p.status === "Failed").length,
        namespaces: [...new Set(filtered.map((p) => p.namespace))],
      },
    },
    timestamp: new Date().toISOString(),
  })
})

router.get("/pods/:namespace", async (req: Request, res: Response) => {
  const namespace = req.params.namespace as string
  const nsErr = validateNamespace(namespace)
  if (nsErr) return res.status(400).json({ success: false, error: nsErr })

  try {
    if (await isK8sReachable()) {
      const result = await getPods(namespace)
      return res.json({
        success: true,
        data: { pods: result.pods, summary: result },
        timestamp: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn("[K8s] Falling back to mock data:", (err as Error).message)
  }
  const filtered = mockPods.filter((p) => p.namespace === namespace)
  res.json({
    success: true,
    data: {
      pods: filtered,
      summary: {
        total: filtered.length,
        running: filtered.filter((p) => p.status === "Running").length,
        pending: filtered.filter((p) => p.status === "Pending").length,
        failed: filtered.filter((p) => p.status === "Failed").length,
      },
    },
    timestamp: new Date().toISOString(),
  })
})

router.get("/nodes", async (_req: Request, res: Response) => {
  try {
    if (await isK8sReachable()) {
      const nodes = await getNodes()
      return res.json({ success: true, data: { nodes }, timestamp: new Date().toISOString() })
    }
  } catch (err) {
    console.warn("[K8s] Falling back to mock data:", (err as Error).message)
  }
  res.json({
    success: true,
    data: {
      nodes: [
        { name: "master-1", status: "Ready", role: "control-plane", age: "47d", version: "v1.30.2", cpu: { capacity: "8", allocatable: "7.5" }, memory: { capacity: "32Gi", allocatable: "30Gi" }, pods: 22 },
        { name: "worker-1", status: "Ready", role: "worker", age: "42d", version: "v1.30.2", cpu: { capacity: "16", allocatable: "15.2" }, memory: { capacity: "64Gi", allocatable: "62Gi" }, pods: 28 },
        { name: "worker-2", status: "Ready", role: "worker", age: "42d", version: "v1.30.2", cpu: { capacity: "16", allocatable: "15.2" }, memory: { capacity: "64Gi", allocatable: "62Gi" }, pods: 31 },
        { name: "worker-3", status: "Ready", role: "worker", age: "42d", version: "v1.30.2", cpu: { capacity: "16", allocatable: "15.2" }, memory: { capacity: "64Gi", allocatable: "62Gi" }, pods: 25 },
        { name: "worker-4", status: "Ready", role: "worker", age: "14d", version: "v1.30.2", cpu: { capacity: "16", allocatable: "15.2" }, memory: { capacity: "64Gi", allocatable: "62Gi" }, pods: 18 },
        { name: "worker-5", status: "NotReady", role: "worker", age: "42d", version: "v1.30.2", cpu: { capacity: "16", allocatable: "15.2" }, memory: { capacity: "64Gi", allocatable: "62Gi" }, pods: 0 },
      ],
    },
    timestamp: new Date().toISOString(),
  })
})

router.get("/deployments", async (req: Request, res: Response) => {
  const namespace = req.query.namespace as string | undefined
  try {
    if (await isK8sReachable()) {
      const deployments = await getDeployments(namespace || undefined)
      return res.json({ success: true, data: { deployments }, timestamp: new Date().toISOString() })
    }
  } catch (err) {
    console.warn("[K8s] Falling back to mock data:", (err as Error).message)
  }
  res.json({
    success: true,
    data: {
      deployments: [
        { name: "api-gateway", namespace: "production", replicas: 5, available: 5, strategy: "RollingUpdate", image: "devi/api-gateway:2.1.0", age: "14d" },
        { name: "auth-service", namespace: "production", replicas: 3, available: 3, strategy: "RollingUpdate", image: "devi/auth-service:1.8.2", age: "21d" },
        { name: "payment-worker", namespace: "production", replicas: 4, available: 4, strategy: "RollingUpdate", image: "devi/payment-worker:3.0.1", age: "7d" },
        { name: "web-frontend", namespace: "staging", replicas: 2, available: 2, strategy: "Recreate", image: "devi/web-frontend:1.5.0", age: "3d" },
        { name: "redis-cache", namespace: "production", replicas: 3, available: 3, strategy: "RollingUpdate", image: "redis:7.4-alpine", age: "30d" },
      ],
    },
    timestamp: new Date().toISOString(),
  })
})

router.get("/health", async (_req: Request, res: Response) => {
  try {
    if (await isK8sReachable()) {
      const health = await getClusterHealth()
      return res.json({ success: true, data: health, timestamp: new Date().toISOString() })
    }
  } catch (err) {
    console.warn("[K8s] Falling back to mock data:", (err as Error).message)
  }
  res.json({
    success: true,
    data: {
      nodes: { total: 6, ready: 5, notReady: 1 },
      pods: { total: 52, running: 48, pending: 2, failed: 2 },
      namespaces: ["production", "staging", "monitoring"],
    },
    timestamp: new Date().toISOString(),
  })
})

router.post("/deployments/:name/restart", async (req: Request, res: Response) => {
  const name = req.params.name as string
  const namespace = (req.body?.namespace as string) || "default"

  const nameErr = validateResourceName(name, "Deployment name")
  if (nameErr) return res.status(400).json({ success: false, error: nameErr })
  const nsErr = validateNamespace(namespace)
  if (nsErr) return res.status(400).json({ success: false, error: nsErr })

  if (!await isK8sReachable()) {
    return res.status(503).json({ success: false, error: "Kubernetes API is not available" })
  }
  try {
    const result = await restartDeployment(name, namespace)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    const status = err.statusCode === 404 ? 404 : 500
    res.status(status).json({ success: false, error: err.message || "Failed to restart deployment" })
  }
})

router.post("/deployments/:name/scale", async (req: Request, res: Response) => {
  const name = req.params.name as string
  const namespace = (req.body?.namespace as string) || "default"
  const replicas = req.body?.replicas

  const nameErr = validateResourceName(name, "Deployment name")
  if (nameErr) return res.status(400).json({ success: false, error: nameErr })
  const nsErr = validateNamespace(namespace)
  if (nsErr) return res.status(400).json({ success: false, error: nsErr })
  const repErr = validateReplicas(replicas)
  if (repErr) return res.status(400).json({ success: false, error: repErr })

  if (!await isK8sReachable()) {
    return res.status(503).json({ success: false, error: "Kubernetes API is not available" })
  }
  try {
    const result = await scaleDeployment(name, namespace, Number(replicas))
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    const status = err.statusCode === 404 ? 404 : 500
    res.status(status).json({ success: false, error: err.message || "Failed to scale deployment" })
  }
})

router.get("/namespaces", async (_req, res) => {
  if (!await isK8sReachable()) {
    return res.json({ success: true, data: ["production", "staging", "monitoring", "default", "kube-system"], timestamp: new Date().toISOString() })
  }
  try {
    const namespaces = await getNamespaces()
    res.json({ success: true, data: namespaces, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get("/pod/:namespace/:name/yaml", async (req, res) => {
  const { namespace, name } = req.params
  if (!await isK8sReachable()) return res.status(503).json({ success: false, error: "Kubernetes API is not available" })
  try {
    const yaml = await getPodYaml(name, namespace)
    res.json({ success: true, data: yaml, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

router.get("/pod/:namespace/:name/logs", async (req, res) => {
  const { namespace, name } = req.params
  const tailLines = parseInt(req.query.tail as string) || 100
  if (!await isK8sReachable()) return res.status(503).json({ success: false, error: "Kubernetes API is not available" })
  try {
    const logs = await getPodLogs(name, namespace, tailLines)
    res.json({ success: true, data: { logs }, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

router.delete("/pod/:namespace/:name", async (req, res) => {
  const { namespace, name } = req.params
  if (!await isK8sReachable()) return res.status(503).json({ success: false, error: "Kubernetes API is not available" })
  try {
    const result = await deletePod(name, namespace)
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

export default router
