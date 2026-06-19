export interface Anomaly {
  id: string
  type: "cpu_spike" | "memory_leak" | "container_restart_loop" | "high_latency" | "error_rate" | "disk_full"
  severity: "info" | "warning" | "critical"
  service: string
  message: string
  suggestion: string
  autoFixable: boolean
  timestamp: string
  detected: boolean
}

interface Metrics {
  cpu: number
  memory: number
  disk: number
  latency?: number
  errorRate?: number
  restartCount?: number
}

const history = new Map<string, Metrics[]>()
const RESTART_THRESHOLD = 3
const CPU_SPIKE_THRESHOLD = 85
const MEMORY_LEAK_THRESHOLD = 90
const LATENCY_THRESHOLD_MS = 500
const ERROR_RATE_THRESHOLD = 0.05

export function detectAnomalies(
  service: string,
  currentMetrics: Metrics,
): Anomaly[] {
  const anomalies: Anomaly[] = []
  const ts = new Date().toISOString()
  const id = () => Math.random().toString(36).slice(2, 10)

  const serviceHistory = history.get(service) || []
  serviceHistory.push(currentMetrics)
  if (serviceHistory.length > 20) serviceHistory.shift()
  history.set(service, serviceHistory)

  // CPU spike detection
  if (currentMetrics.cpu > CPU_SPIKE_THRESHOLD) {
    const recentAvg = serviceHistory.slice(-5).reduce((s, m) => s + m.cpu, 0) / Math.min(serviceHistory.length, 5)
    if (currentMetrics.cpu > recentAvg * 1.3) {
      anomalies.push({
        id: id(),
        type: "cpu_spike",
        severity: currentMetrics.cpu > 95 ? "critical" : "warning",
        service,
        message: `CPU spike detected: ${currentMetrics.cpu}% (avg: ${recentAvg.toFixed(0)}%)`,
        suggestion: `Scale up "${service}" or investigate process using excessive CPU.`,
        autoFixable: true,
        timestamp: ts,
        detected: true,
      })
    }
  }

  // Memory leak detection
  if (currentMetrics.memory > MEMORY_LEAK_THRESHOLD && serviceHistory.length >= 5) {
    const trend = serviceHistory.slice(-5)
    const first = trend[0].memory
    const last = trend[trend.length - 1].memory
    if (last > first && (last - first) > 10) {
      anomalies.push({
        id: id(),
        type: "memory_leak",
        severity: currentMetrics.memory > 95 ? "critical" : "warning",
        service,
        message: `Memory usage trending up: ${first.toFixed(0)}% → ${last.toFixed(0)}% over last ${trend.length} samples`,
        suggestion: `Restart "${service}" to reclaim memory, then investigate for leaks.`,
        autoFixable: true,
        timestamp: ts,
        detected: true,
      })
    }
  }

  // Container restart loop detection
  if ((currentMetrics.restartCount || 0) >= RESTART_THRESHOLD) {
    anomalies.push({
      id: id(),
      type: "container_restart_loop",
      severity: "critical",
      service,
      message: `Container "${service}" has restarted ${currentMetrics.restartCount} times — possible crash loop`,
      suggestion: `Check logs with "docker logs ${service}" and investigate the crash.`,
      autoFixable: false,
      timestamp: ts,
      detected: true,
    })
  }

  // High latency detection
  if (currentMetrics.latency && currentMetrics.latency > LATENCY_THRESHOLD_MS) {
    anomalies.push({
      id: id(),
      type: "high_latency",
      severity: currentMetrics.latency > 1000 ? "critical" : "warning",
      service,
      message: `High latency detected: ${currentMetrics.latency}ms on "${service}"`,
      suggestion: `Check database queries and external API calls for "${service}".`,
      autoFixable: false,
      timestamp: ts,
      detected: true,
    })
  }

  // Error rate detection
  if (currentMetrics.errorRate && currentMetrics.errorRate > ERROR_RATE_THRESHOLD) {
    anomalies.push({
      id: id(),
      type: "error_rate",
      severity: currentMetrics.errorRate > 0.1 ? "critical" : "warning",
      service,
      message: `Error rate elevated: ${(currentMetrics.errorRate * 100).toFixed(1)}% on "${service}"`,
      suggestion: `Inspect recent logs and check for deployment issues.`,
      autoFixable: false,
      timestamp: ts,
      detected: true,
    })
  }

  // Disk full detection
  if (currentMetrics.disk > 90) {
    anomalies.push({
      id: id(),
      type: "disk_full",
      severity: currentMetrics.disk > 95 ? "critical" : "warning",
      service,
      message: `Disk usage critical: ${currentMetrics.disk}% on "${service}"`,
      suggestion: "Clean up old logs and temporary files, or increase disk size.",
      autoFixable: false,
      timestamp: ts,
      detected: true,
    })
  }

  return anomalies
}

export function generateAnomalyResponse(anomalies: Anomaly[]): { content: string; code?: string } {
  if (anomalies.length === 0) {
    return { content: "✅ No anomalies detected. All systems operating within normal parameters." }
  }

  const critical = anomalies.filter((a) => a.severity === "critical")
  const warnings = anomalies.filter((a) => a.severity === "warning")
  const autoFixable = anomalies.filter((a) => a.autoFixable)

  let content = `🔍 Anomaly Scan Results\n\n`
  if (critical.length > 0) {
    content += `🚨 Critical Issues (${critical.length}):\n${critical.map((a) => `  • ${a.message}`).join("\n")}\n\n`
  }
  if (warnings.length > 0) {
    content += `⚠️ Warnings (${warnings.length}):\n${warnings.map((a) => `  • ${a.message}`).join("\n")}\n\n`
  }

  content += `💡 Suggestions:\n${anomalies.map((a) => `  • ${a.suggestion}`).join("\n")}`

  if (autoFixable.length > 0) {
    content += `\n\n🔄 Auto-fix available for ${autoFixable.length} issue(s). Would you like me to apply fixes?`
  }

  return { content }
}
