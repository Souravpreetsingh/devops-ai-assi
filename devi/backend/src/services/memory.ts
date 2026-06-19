export interface AIMemory {
  id: string
  sessionId: string
  type: "command" | "preference" | "workflow" | "context"
  content: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface CommandSuggestion {
  id: string
  command: string
  description: string
  prompt: string
  context: string
}

const memories: AIMemory[] = []
const sessions = new Map<string, string[]>() // sessionId -> command history

export function remember(sessionId: string, type: AIMemory["type"], content: string, metadata?: Record<string, any>): AIMemory {
  const memory: AIMemory = {
    id: Math.random().toString(36).slice(2, 10),
    sessionId,
    type,
    content,
    metadata,
    timestamp: new Date().toISOString(),
  }
  memories.push(memory)
  if (memories.length > 500) memories.shift()
  return memory
}

export function getSessionMemory(sessionId: string): AIMemory[] {
  return memories.filter((m) => m.sessionId === sessionId)
}

export function getAllMemory(type?: AIMemory["type"]): AIMemory[] {
  if (type) return memories.filter((m) => m.type === type)
  return [...memories]
}

export function getContextSummary(sessionId: string): string {
  const sessionMemories = getSessionMemory(sessionId)
  if (sessionMemories.length === 0) return ""

  const commands = sessionMemories.filter((m) => m.type === "command").slice(-10)
  const workflows = sessionMemories.filter((m) => m.type === "workflow").slice(-3)
  const preferences = sessionMemories.filter((m) => m.type === "preference").slice(-3)

  const lines: string[] = []

  if (commands.length > 0) {
    lines.push(`Recent commands (${commands.length}):`)
    commands.forEach((c) => lines.push(`  - ${c.content}`))
  }

  if (workflows.length > 0) {
    lines.push(`Known workflows:`)
    workflows.forEach((w) => lines.push(`  - ${w.content}`))
  }

  if (preferences.length > 0) {
    lines.push(`Preferences:`)
    preferences.forEach((p) => lines.push(`  - ${p.content}`))
  }

  return lines.join("\n")
}

export function generateSuggestions(sessionId: string, context: { system?: any; docker?: any; k8s?: any }): CommandSuggestion[] {
  const suggestions: CommandSuggestion[] = []

  // System-based suggestions
  if (context.system?.cpu > 70) {
    suggestions.push({
      id: Math.random().toString(36).slice(2, 10),
      command: "Check top processes",
      description: "CPU usage is high. View top processes to find the culprit.",
      prompt: "Show me the top CPU-consuming processes",
      context: "system",
    })
  }

  if (context.system?.memory > 80) {
    suggestions.push({
      id: Math.random().toString(36).slice(2, 10),
      command: "Analyze memory usage",
      description: "Memory usage is elevated. Let me analyze what's consuming it.",
      prompt: "Analyze memory usage and suggest optimizations",
      context: "system",
    })
  }

  // Docker-based suggestions
  if (context.docker?.containers?.length > 0) {
    const stoppedContainers = context.docker.containers.filter((c: any) => c.state === "exited")
    if (stoppedContainers.length > 0) {
      suggestions.push({
        id: Math.random().toString(36).slice(2, 10),
        command: `Restart ${stoppedContainers[0].name || "stopped container"}`,
        description: `${stoppedContainers.length} container(s) are stopped. Restart them?`,
        prompt: `Restart the ${stoppedContainers[0].name || "stopped"} container`,
        context: "docker",
      })
    }

    const runningContainers = context.docker.containers.filter((c: any) => c.state === "running")
    if (runningContainers.length > 0) {
      suggestions.push({
        id: Math.random().toString(36).slice(2, 10),
        command: "View container logs",
        description: "Check recent logs from running containers.",
        prompt: "Show me logs from all running containers",
        context: "docker",
      })
    }
  }

  // K8s-based suggestions
  if (context.k8s?.pods) {
    const failedPods = context.k8s.pods.filter((p: any) => p.status !== "Running" && p.status !== "Ready")
    if (failedPods.length > 0) {
      suggestions.push({
        id: Math.random().toString(36).slice(2, 10),
        command: `Inspect failing pod: ${failedPods[0].name}`,
        description: `Pod "${failedPods[0].name}" is in ${failedPods[0].status} state. Check details.`,
        prompt: `Describe the pod ${failedPods[0].name} and diagnose the issue`,
        context: "kubernetes",
      })
    }

    const lowReplicas = context.k8s.deployments?.filter((d: any) => d.available !== d.desired)
    if (lowReplicas?.length > 0) {
      suggestions.push({
        id: Math.random().toString(36).slice(2, 10),
        command: `Scale ${lowReplicas[0].name} deployment`,
        description: `Deployment "${lowReplicas[0].name}" has ${lowReplicas[0].available}/${lowReplicas[0].desired} replicas ready.`,
        prompt: `Scale the ${lowReplicas[0].name} deployment to match desired replicas`,
        context: "kubernetes",
      })
    }
  }

  // Fallback generic suggestions
  if (suggestions.length === 0) {
    suggestions.push({
      id: Math.random().toString(36).slice(2, 10),
      command: "Run system diagnostics",
      description: "Run a full system health check and diagnostics.",
      prompt: "Run a complete system diagnostic and report any issues",
      context: "system",
    })
    suggestions.push({
      id: Math.random().toString(36).slice(2, 10),
      command: "Check Docker status",
      description: "View all running containers and their health.",
      prompt: "Show me the Docker status overview",
      context: "docker",
    })
  }

  return suggestions
}
