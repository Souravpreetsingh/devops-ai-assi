import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || "Unknown error"
    return Promise.reject(new Error(msg))
  },
)

export const systemApi = {
  stats: () => api.get("/system/stats").then((r) => r.data.data),
}

export const dockerApi = {
  list: () => api.get("/docker/containers").then((r) => r.data.data),
  deploy: (image: string, name?: string, ports?: any, env?: any) => api.post("/docker/containers/deploy", { image, name, ports, env }).then((r) => r.data.data),
  get: (id: string) => api.get(`/docker/containers/${id}`).then((r) => r.data.data),
  restart: (id: string) => api.post(`/docker/containers/${id}/restart`),
  stop: (id: string) => api.post(`/docker/containers/${id}/stop`),
  start: (id: string) => api.post(`/docker/containers/${id}/start`),
  logs: (id: string, tail = 100) => api.get(`/docker/containers/${id}/logs?tail=${tail}`).then((r) => r.data.data),
}

export const kubernetesApi = {
  pods: (ns?: string) => api.get("/kubernetes/pods", { params: { namespace: ns } }).then((r) => r.data.data),
  nodes: () => api.get("/kubernetes/nodes").then((r) => r.data.data),
  deployments: (ns?: string) => api.get("/kubernetes/deployments", { params: { namespace: ns } }).then((r) => r.data.data),
  health: () => api.get("/kubernetes/health").then((r) => r.data.data),
  namespaces: () => api.get("/kubernetes/namespaces").then((r) => r.data.data),
  restartDeployment: (name: string, namespace: string) => api.post(`/kubernetes/deployments/${name}/restart`, { namespace }),
  scaleDeployment: (name: string, namespace: string, replicas: number) =>
    api.post(`/kubernetes/deployments/${name}/scale`, { namespace, replicas }),
  deletePod: (name: string, namespace: string) => api.delete(`/kubernetes/pod/${namespace}/${name}`),
  podYaml: (name: string, namespace: string) => api.get(`/kubernetes/pod/${namespace}/${name}/yaml`).then((r) => r.data.data),
  podLogs: (name: string, namespace: string, tail = 100) => api.get(`/kubernetes/pod/${namespace}/${name}/logs?tail=${tail}`).then((r) => r.data.data),
}

export const logsApi = {
  list: (source?: string, lines = 50) => api.get("/logs", { params: { source, lines } }).then((r) => r.data.data),
  sources: () => api.get("/logs/sources").then((r) => r.data.data),
}

export const aiApi = {
  chat: (message: string) => api.post("/ai/chat", { message }).then((r) => r.data.data),
}

export const terminalApi = {
  execute: (command: string) => api.post("/terminal/execute", { command }).then((r) => r.data.data),
  validate: (command: string) => api.post("/terminal/validate", { command }).then((r) => r.data.data),
}

export const authApi = {
  login: (username: string, password: string) => api.post("/auth/login", { username, password }).then((r) => r.data.data),
  me: () => api.get("/auth/me").then((r) => r.data.data),
  users: () => api.get("/auth/users").then((r) => r.data.data),
  createUser: (username: string, password: string, role: string) => api.post("/auth/users", { username, password, role }).then((r) => r.data.data),
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }).then((r) => r.data.data),
  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
}

export const cicdApi = {
  deployments: () => api.get("/cicd/deployments").then((r) => r.data.data),
  createDeployment: (data: any) => api.post("/cicd/deployments", data).then((r) => r.data.data),
  rollback: (id: string) => api.post(`/cicd/deployments/${id}/rollback`).then((r) => r.data.data),
  pipelines: () => api.get("/cicd/pipelines").then((r) => r.data.data),
  createPipeline: (data: any) => api.post("/cicd/pipelines", data).then((r) => r.data.data),
  history: (limit = 50) => api.get("/cicd/history", { params: { limit } }).then((r) => r.data.data),
}

export const agentApi = {
  anomalies: (service: string, metrics: any) => api.post("/agent/anomalies", { service, metrics }).then((r) => r.data.data),
  suggestions: (sessionId: string, context: any) => api.post("/agent/suggestions", { sessionId, context }).then((r) => r.data.data),
  context: (sessionId: string) => api.get("/agent/context", { params: { sessionId } }).then((r) => r.data.data),
  remember: (sessionId: string, type: string, content: string, metadata?: any) => api.post("/agent/remember", { sessionId, type, content, metadata }).then((r) => r.data.data),
}

export const deployApi = {
  parse: (text: string) => api.post("/docker/parse", { text }).then((r) => r.data.data),
  create: (image: string, name?: string, ports?: any, env?: string[], volumes?: string[]) =>
    api.post("/docker/create", { image, name, ports, env, volumes }).then((r) => r.data.data),
  deploy: (image: string, name?: string, ports?: any, env?: string[], volumes?: string[], start?: boolean) =>
    api.post("/docker/deploy", { image, name, ports, env, volumes, start }).then((r) => r.data.data),
  compose: (stack?: string, image?: string, name?: string, ports?: any, env?: string[], volumes?: string[]) =>
    api.post("/docker/compose", { stack, image, name, ports, env, volumes }).then((r) => r.data.data),
  containerize: (projectPath?: string, imageName?: string) =>
    api.post("/docker/containerize", { projectPath, imageName }).then((r) => r.data.data),
  logs: (id: string, tail?: number) => api.get(`/docker/logs/${id}`, { params: { tail } }).then((r) => r.data.data),
}
