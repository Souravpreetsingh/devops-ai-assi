export interface Deployment {
  id: string
  service: string
  version: string
  type: "frontend" | "backend" | "infra"
  status: "deploying" | "running" | "failed" | "rolled_back"
  strategy: "rolling" | "canary" | "recreate"
  commitSha?: string
  branch?: string
  imageTag?: string
  replicas: number
  healthEndpoint?: string
  startedAt: string
  completedAt?: string
  triggeredBy: string
  rollbackTo?: string
}

export interface PipelineRun {
  id: string
  pipeline: string
  status: "pending" | "running" | "success" | "failed"
  steps: { name: string; status: "pending" | "running" | "success" | "failed"; duration?: number }[]
  startedAt: string
  completedAt?: string
}

interface DeploymentHistoryEntry {
  id: string
  type: "deployment" | "rollback" | "command" | "ai_action" | "config_change"
  service: string
  description: string
  status: "success" | "failed" | "in_progress"
  user: string
  metadata?: Record<string, any>
  timestamp: string
}

const deployments: Deployment[] = []
const pipelineRuns: PipelineRun[] = []
const historyLog: DeploymentHistoryEntry[] = []

export function createDeployment(
  service: string,
  version: string,
  type: Deployment["type"],
  strategy: Deployment["strategy"],
  replicas: number,
  imageTag: string,
  triggeredBy: string,
): Deployment {
  const dep: Deployment = {
    id: Math.random().toString(36).slice(2, 10),
    service,
    version,
    type,
    status: "deploying",
    strategy,
    replicas,
    imageTag,
    startedAt: new Date().toISOString(),
    triggeredBy,
  }

  // Simulate deployment
  setTimeout(() => {
    dep.status = "running"
    dep.completedAt = new Date().toISOString()
    addHistory("deployment", service, `${service} v${version} deployed successfully`, "success", triggeredBy, { strategy, replicas })
  }, 3000)

  deployments.push(dep)
  addHistory("deployment", service, `Deploying ${service} v${version}`, "in_progress", triggeredBy, { strategy, replicas })

  return dep
}

export function rollbackDeployment(
  deploymentId: string,
  triggeredBy: string,
): Deployment | null {
  const dep = deployments.find((d) => d.id === deploymentId)
  if (!dep) return null

  dep.status = "rolled_back"
  dep.rollbackTo = dep.version
  addHistory("rollback", dep.service, `Rolled back ${dep.service} from v${dep.version}`, "success", triggeredBy, { deploymentId })

  return dep
}

export function getDeployments(): Deployment[] {
  return deployments
}

export function getPipelineRuns(): PipelineRun[] {
  return pipelineRuns
}

export function createPipelineRun(
  pipeline: string,
  steps: { name: string; status: PipelineRun["steps"][0]["status"] }[],
): PipelineRun {
  const run: PipelineRun = {
    id: Math.random().toString(36).slice(2, 10),
    pipeline,
    status: "running",
    steps: steps.map((s) => ({ ...s, duration: s.status === "success" ? Math.random() * 120 + 10 : undefined })),
    startedAt: new Date().toISOString(),
  }
  pipelineRuns.push(run)

  setTimeout(() => {
    run.status = "success"
    run.completedAt = new Date().toISOString()
    run.steps = run.steps.map((s) => ({ ...s, status: "success", duration: Math.random() * 120 + 10 }))
    addHistory("deployment", pipeline, `Pipeline "${pipeline}" completed successfully`, "success", "system")
  }, 5000)

  return run
}

export function addHistory(
  type: DeploymentHistoryEntry["type"],
  service: string,
  description: string,
  status: DeploymentHistoryEntry["status"],
  user: string,
  metadata?: Record<string, any>,
) {
  const entry: DeploymentHistoryEntry = {
    id: Math.random().toString(36).slice(2, 10),
    type,
    service,
    description,
    status,
    user,
    metadata,
    timestamp: new Date().toISOString(),
  }
  historyLog.unshift(entry)
  if (historyLog.length > 100) historyLog.pop()
}

export function getHistory(limit = 50): DeploymentHistoryEntry[] {
  return historyLog.slice(0, limit)
}

export function addCommandHistory(command: string, user: string, status: "success" | "failed") {
  addHistory("command", "terminal", `Executed: ${command}`, status, user)
}
