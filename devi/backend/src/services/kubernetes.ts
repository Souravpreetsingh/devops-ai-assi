import * as k8s from "@kubernetes/client-node"

let kcInstance: k8s.KubeConfig | null = null
let connectionAttempted = false

function getKubeConfig(): k8s.KubeConfig | null {
  if (!connectionAttempted) {
    connectionAttempted = true
    try {
      const kc = new k8s.KubeConfig()
      kc.loadFromDefault()
      kcInstance = kc
      console.log("[K8s] KubeConfig loaded from default location")
    } catch (err) {
      console.warn("[K8s] Failed to load kubeconfig:", (err as Error).message)
    }
  }
  return kcInstance
}

let reachableCache = false
let reachableChecked = false

export async function isK8sReachable(): Promise<boolean> {
  if (reachableChecked) return reachableCache
  const kc = getKubeConfig()
  if (!kc) return false
  try {
    const api = kc.makeApiClient(k8s.CoreV1Api)
    await api.listNamespace()
    reachableCache = true
  } catch {
    reachableCache = false
  }
  reachableChecked = true
  return reachableCache
}

export function resetK8sCache() {
  reachableChecked = false
}

export interface PodInfo {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
  ip: string
  cpu: string
  memory: string
  containers: number
}

export interface NodeInfo {
  name: string
  status: string
  role: string
  age: string
  version: string
  cpu: { capacity: string; allocatable: string }
  memory: { capacity: string; allocatable: string }
  pods: number
}

export interface DeploymentInfo {
  name: string
  namespace: string
  replicas: number
  available: number
  strategy: string
  image: string
  age: string
}

async function getPodsRaw(namespace?: string): Promise<k8s.V1PodList> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.CoreV1Api)
  if (namespace) return api.listNamespacedPod({ namespace })
  return api.listPodForAllNamespaces()
}

export async function getPods(namespace?: string): Promise<{ pods: PodInfo[]; total: number; running: number }> {
  const res = await getPodsRaw(namespace)
  const items = res.items || []

  const pods: PodInfo[] = items.map((p) => {
    const containerStatuses = p.status?.containerStatuses || []
    const ready = containerStatuses.filter((cs) => cs.ready).length
    const restarts = containerStatuses.reduce((sum, cs) => sum + (cs.restartCount || 0), 0)
    const ageMs = Date.now() - new Date(p.metadata?.creationTimestamp || Date.now()).getTime()
    const ageDays = Math.floor(ageMs / 86400000)
    const ageHours = Math.floor((ageMs % 86400000) / 3600000)
    const ageStr = ageDays > 0 ? `${ageDays}d` : `${ageHours}h`

    const containers = p.spec?.containers?.length || 0

    return {
      name: p.metadata?.name || "unknown",
      namespace: p.metadata?.namespace || "default",
      status: p.status?.phase || "Unknown",
      ready: `${ready}/${containerStatuses.length}`,
      restarts,
      age: ageStr,
      node: p.spec?.nodeName || "",
      ip: p.status?.podIP || "",
      cpu: p.spec?.containers?.[0]?.resources?.requests?.cpu || "",
      memory: p.spec?.containers?.[0]?.resources?.requests?.memory || "",
      containers,
    }
  })

  const running = pods.filter((p) => p.status === "Running").length
  return { pods, total: pods.length, running }
}

export async function getNodes(): Promise<NodeInfo[]> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.CoreV1Api)
  const res = await api.listNode()

  return (res.items || []).map((n) => {
    const labels = n.metadata?.labels || {}
    const role = labels["kubernetes.io/role"] || labels["node-role.kubernetes.io/control-plane"] || "worker"
    const ageMs = Date.now() - new Date(n.metadata?.creationTimestamp || Date.now()).getTime()
    const ageDays = Math.floor(ageMs / 86400000)
    const conditions = n.status?.conditions || []
    const ready = conditions.find((c) => c.type === "Ready")
    const status = ready?.status === "True" ? "Ready" : "NotReady"

    return {
      name: n.metadata?.name || "unknown",
      status,
      role,
      age: `${ageDays}d`,
      version: n.status?.nodeInfo?.kubeletVersion || "",
      cpu: {
        capacity: n.status?.capacity?.cpu || "0",
        allocatable: n.status?.allocatable?.cpu || "0",
      },
      memory: {
        capacity: n.status?.capacity?.memory || "0",
        allocatable: n.status?.allocatable?.memory || "0",
      },
      pods: parseInt(n.status?.capacity?.pods || "0"),
    }
  })
}

export async function getDeployments(namespace?: string): Promise<DeploymentInfo[]> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.AppsV1Api)

  let res: k8s.V1DeploymentList
  if (namespace) {
    res = await api.listNamespacedDeployment({ namespace })
  } else {
    res = await api.listDeploymentForAllNamespaces()
  }

  return (res.items || []).map((d) => {
    const ageMs = Date.now() - new Date(d.metadata?.creationTimestamp || Date.now()).getTime()
    const ageDays = Math.floor(ageMs / 86400000)

    return {
      name: d.metadata?.name || "unknown",
      namespace: d.metadata?.namespace || "default",
      replicas: d.spec?.replicas || 0,
      available: d.status?.availableReplicas || 0,
      strategy: d.spec?.strategy?.type || "RollingUpdate",
      image: d.spec?.template?.spec?.containers?.[0]?.image || "",
      age: `${ageDays}d`,
    }
  })
}

const VALID_NAME_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/
const VALID_NAMESPACE_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/
const MAX_NAME_LENGTH = 253

export function validateResourceName(name: string, field: string): string | null {
  if (!name || typeof name !== "string") return `${field} is required`
  if (name.length > MAX_NAME_LENGTH) return `${field} exceeds maximum length (${MAX_NAME_LENGTH})`
  if (!VALID_NAME_RE.test(name)) return `${field} contains invalid characters (use lowercase alphanumeric, dots, hyphens)`
  return null
}

export function validateNamespace(ns: string): string | null {
  if (!ns || typeof ns !== "string") return "Namespace is required"
  if (ns.length > 253) return "Namespace exceeds maximum length (253)"
  if (!VALID_NAMESPACE_RE.test(ns)) return "Namespace contains invalid characters"
  return null
}

export function validateReplicas(count: unknown): string | null {
  if (count === undefined || count === null) return "Replicas count is required"
  const num = Number(count)
  if (!Number.isInteger(num)) return "Replicas must be an integer"
  if (num < 0) return "Replicas cannot be negative"
  if (num > 1000) return "Replicas exceeds maximum (1000)"
  return null
}

export async function restartDeployment(name: string, namespace: string): Promise<{ message: string }> {
  const nameErr = validateResourceName(name, "Deployment name")
  if (nameErr) throw new Error(nameErr)
  const nsErr = validateNamespace(namespace)
  if (nsErr) throw new Error(nsErr)

  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.AppsV1Api)

  const deployment = await api.readNamespacedDeployment({ name, namespace })

  const annotationKey = "kubectl.kubernetes.io/restartedAt"
  const annotations = deployment.metadata?.annotations || {}
  annotations[annotationKey] = new Date().toISOString()

  await api.replaceNamespacedDeployment({
    name,
    namespace,
    body: {
      ...deployment,
      metadata: {
        ...deployment.metadata,
        annotations,
      },
    },
  })

  return { message: `Deployment "${name}" in namespace "${namespace}" is restarting` }
}

export async function scaleDeployment(
  name: string,
  namespace: string,
  replicas: number,
): Promise<{ message: string; replicas: number }> {
  const nameErr = validateResourceName(name, "Deployment name")
  if (nameErr) throw new Error(nameErr)
  const nsErr = validateNamespace(namespace)
  if (nsErr) throw new Error(nsErr)
  const repErr = validateReplicas(replicas)
  if (repErr) throw new Error(repErr)

  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.AppsV1Api)

  await api.patchNamespacedDeploymentScale({
    name,
    namespace,
    body: { spec: { replicas } },
  })

  return { message: `Deployment "${name}" scaled to ${replicas} replicas`, replicas }
}

export async function getPodYaml(name: string, namespace: string): Promise<object> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.CoreV1Api)
  const res = await api.readNamespacedPod({ name, namespace })
  return res as unknown as object
}

export async function getPodLogs(name: string, namespace: string, tailLines = 100): Promise<string> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.CoreV1Api)
  const res = await api.readNamespacedPodLog({ name, namespace, tailLines })
  return res
}

export async function deletePod(name: string, namespace: string): Promise<{ message: string }> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.CoreV1Api)
  await api.deleteNamespacedPod({ name, namespace })
  return { message: `Pod "${name}" in namespace "${namespace}" has been deleted` }
}

export async function getNamespaces(): Promise<string[]> {
  const kc = getKubeConfig()
  if (!kc) throw new Error("Kubernetes config not available")
  const api = kc.makeApiClient(k8s.CoreV1Api)
  const res = await api.listNamespace()
  return (res.items || []).map((ns) => ns.metadata?.name || "unknown")
}

export async function getClusterHealth(): Promise<{
  nodes: { total: number; ready: number; notReady: number }
  pods: { total: number; running: number; pending: number; failed: number }
  namespaces: string[]
}> {
  const [nodes, allPods] = await Promise.all([getNodes(), getPods()])

  return {
    nodes: {
      total: nodes.length,
      ready: nodes.filter((n) => n.status === "Ready").length,
      notReady: nodes.filter((n) => n.status === "NotReady").length,
    },
    pods: {
      total: allPods.total,
      running: allPods.running,
      pending: allPods.pods.filter((p) => p.status === "Pending").length,
      failed: allPods.pods.filter((p) => p.status === "Failed").length,
    },
    namespaces: [...new Set(allPods.pods.map((p) => p.namespace))],
  }
}
