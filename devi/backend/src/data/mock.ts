const GB = (n: number) => `${n.toFixed(1)} GB`

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

export const mockSystemStats = {
  cpu: {
    usage: rand(20, 92),
    cores: 12,
    load: [rand(1, 8), rand(2, 7), rand(3, 6)],
    temperature: rand(55, 85),
    history: Array.from({ length: 30 }, (_, i) => ({
      time: new Date(Date.now() - (29 - i) * 2000).toISOString(),
      value: rand(20, 92),
    })),
  },
  memory: {
    total: 32,
    used: rand(12, 28),
    percent: rand(40, 88),
    swap: { total: 8, used: rand(0.5, 3) },
  },
  disk: {
    total: 512,
    used: rand(180, 460),
    percent: rand(35, 90),
    readSpeed: rand(100, 800),
    writeSpeed: rand(50, 400),
    partitions: [
      { mount: "/", total: 512, used: rand(180, 400), fs: "ext4" },
      { mount: "/var/lib/docker", total: 200, used: rand(80, 160), fs: "ext4" },
      { mount: "/data", total: 1000, used: rand(200, 600), fs: "xfs" },
    ],
  },
  network: {
    rxBytes: rand(1e8, 1e9),
    txBytes: rand(5e7, 5e8),
    rxSpeed: rand(10, 200),
    txSpeed: rand(5, 100),
    connections: rand(200, 2000),
    interfaces: [
      { name: "eth0", ip: "10.0.1.5", rx: rand(1e8, 5e8), tx: rand(5e7, 2e8), status: "up" },
      { name: "eth1", ip: "10.0.2.5", rx: rand(5e7, 2e8), tx: rand(2e7, 1e8), status: "up" },
    ],
  },
  uptime: 3600 * (24 * 14 + 3),
  processes: rand(180, 320),
  hostname: "devi-node-01",
  os: "Ubuntu 24.04 LTS",
  kernel: "6.8.0-35-generic",
}

const containerNames = [
  "api-gateway", "auth-service", "user-service", "payment-worker",
  "redis-cache", "postgres-main", "nginx-reverse-proxy", "message-queue",
  "log-collector", "monitoring-agent",
]

function mockContainer(name: string) {
  const statuses = ["running", "running", "running", "running", "running", "running", "stopped", "paused"] as const
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  return {
    id: `sha256:${Math.random().toString(16).slice(2, 14)}`,
    name,
    image: `${name}:${rand(1, 3)}.${rand(0, 9)}.${rand(0, 9)}`,
    status,
    created: new Date(Date.now() - rand(1, 72) * 3600000).toISOString(),
    ports: name.includes("api") ? [{ host: rand(3000, 9000), container: 80, protocol: "tcp" as const }] : [],
    cpu: rand(0.5, 45),
    memory: { used: rand(32, 2048), limit: 2048 },
    restartCount: rand(0, 5),
    health: status === "running" ? (Math.random() > 0.15 ? "healthy" as const : "unhealthy" as const) : "unhealthy" as const,
  }
}

export const mockContainers = containerNames.map(mockContainer)

export const mockContainerStats = {
  totalContainers: containerNames.length,
  running: mockContainers.filter((c) => c.status === "running").length,
  stopped: mockContainers.filter((c) => c.status === "stopped").length,
  paused: mockContainers.filter((c) => c.status === "paused").length,
  images: 24,
  volumes: 8,
  networks: 3,
}

const podPrefixes = ["api", "auth", "web", "worker", "cache", "db", "queue", "monitor", "ingress", "cron"]
function mockPod(index: number) {
  const prefix = podPrefixes[index % podPrefixes.length]
  const statuses = ["Running", "Running", "Running", "Running", "Running", "Pending", "Succeeded", "Failed"] as const
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const restarts = status === "Running" ? rand(0, 3) : 0
  return {
    name: `${prefix}-deploy-${Math.random().toString(36).slice(2, 6)}`,
    namespace: ["production", "staging", "monitoring"][rand(0, 2)],
    status,
    replicas: status === "Running" ? rand(1, 5) : 0,
    ready: status === "Running" ? `${rand(1, 4)}/${rand(3, 5)}` : "0/0",
    cpu: status === "Running" ? rand(10, 90) : 0,
    memory: status === "Running" ? `${rand(50, 800)}Mi` : "0Mi",
    age: `${rand(1, 30)}d`,
    restarts,
    node: `worker-${rand(1, 5)}`,
    ip: `10.42.${rand(0, 255)}.${rand(1, 254)}`,
  }
}

export const mockPods = Array.from({ length: 52 }, (_, i) => mockPod(i))

export const mockPodSummary = {
  total: 52,
  running: mockPods.filter((p) => p.status === "Running").length,
  pending: mockPods.filter((p) => p.status === "Pending").length,
  failed: mockPods.filter((p) => p.status === "Failed").length,
  succeeded: mockPods.filter((p) => p.status === "Succeeded").length,
  namespaces: ["production", "staging", "monitoring"],
}

export const mockLogSources = [
  { id: "api-gateway", type: "container" as const, label: "API Gateway" },
  { id: "auth-service", type: "container" as const, label: "Auth Service" },
  { id: "payment-worker", type: "container" as const, label: "Payment Worker" },
  { id: "postgres-main", type: "container" as const, label: "PostgreSQL" },
  { id: "production/nginx-ingress", type: "pod" as const, label: "Nginx Ingress (prod)" },
  { id: "staging/web-deploy", type: "pod" as const, label: "Web Deploy (staging)" },
  { id: "monitoring/prometheus", type: "pod" as const, label: "Prometheus" },
]

const logLevels = ["INFO", "WARN", "ERROR", "DEBUG"] as const
const logMessages = [
  "GET /api/v1/health 200 2ms",
  "POST /api/v1/charge 201 143ms",
  "Database query completed in 45ms",
  "Cache miss for key: user:session:abc123",
  "Redis connection pool: 12/20 active",
  "Circuit breaker closed for downstream: billing-svc",
  "TLS handshake completed with client 10.42.1.15",
  "Request rate limiting: 1450/2000 requests this window",
  "Garbage collection paused for 12ms",
  "Replica set scaled to 3 instances",
]

export function generateLogLines(source: string, count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 3000).toISOString(),
    level: logLevels[Math.floor(Math.random() * logLevels.length)],
    source,
    message: logMessages[Math.floor(Math.random() * logMessages.length)],
  }))
}

const aiResponseTemplates = [
  {
    content: "I've analyzed the cluster state. All nodes are healthy except worker-5 which shows NotReady status. I recommend cordoning the node and draining workloads to worker-2 and worker-3.",
    code: "kubectl cordon worker-5\nkubectl drain worker-5 --ignore-daemonsets --delete-emptydir-data\nkubectl get nodes -o wide",
    language: "bash",
  },
  {
    content: "Deployment analysis complete. The canary release of api-gateway v2.1.0 is receiving 15% of traffic with a 0.2% error rate — well below the 1% threshold. Safe to proceed with full rollout.",
    code: `Rollout status: Canary (15% traffic)
Error rate: 0.2% (threshold: 1.0%)
P50 latency: 42ms (baseline: 45ms)
P99 latency: 210ms (baseline: 195ms)
Health checks: ✅ All passing
Recommendation: PROCEED with full rollout`,
    language: "yaml",
  },
  {
    content: "I've identified a memory leak in the payment-worker service. Heap analysis shows 78% of allocations originate from the batch processor not releasing HTTP connections. I'll trigger a rolling restart while we patch it.",
    code: "goroutine profile: total 48204\n@ main.(*BatchProcessor).process\n  /app/worker/processor.go:142 (40210 goroutines)\n@ net/http.(*Transport).roundTrip\n  /usr/local/go/src/net/http/transport.go:2653 (3500 goroutines)",
    language: "go",
  },
  {
    content: "Database migration v0042 is ready for review. The change adds an index on `transactions.created_at` which should improve query performance by ~60% for the reporting dashboard. Estimated runtime: 45s.",
    code: "CREATE INDEX CONCURRENTLY idx_transactions_created_at\nON transactions (created_at DESC)\nWHERE status IN ('completed', 'refunded');\n\n-- Estimated impact:\n--   + 240MB index size\n--   - 60% query time on date-range queries\n--   ⏱  ~45s execution (no downtime expected)",
    language: "sql",
  },
  {
    content: "Here's the incident report from the 14:22 UTC CPU spike on api-gateway:\n\nRoot cause: A traffic surge from a marketing campaign (3x normal load).\nHPA response: Scaled from 5 to 12 replicas in 4 minutes.\nImpact: P99 latency increased to 2.1s for 90 seconds, then recovered.\nNo customer-facing errors.",
  },
  {
    content: "Container resource optimization scan complete. I found 3 containers with oversized resource requests:\n\n• redis-cache: requests 4 CPU, actually uses 0.8\n• postgres-main: requests 16GB RAM, actually uses 4.2GB\n• monitoring-agent: requests 2 CPU, actually uses 0.3\n\nRecommendation: Downsize to save ~$420/month on cloud costs.",
    code: "Resource Optimization Report:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nredis-cache      │ 4.0 → 1.0 CPU  │ $180/mo savings\npostgres-main    │ 16 → 6 GB RAM  │ $140/mo savings\nmonitoring-agent │ 2.0 → 0.5 CPU  │ $100/mo savings\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEstimated total: $420/mo savings",
    language: "yaml",
  },
]

export function generateAiResponse() {
  const tpl = aiResponseTemplates[Math.floor(Math.random() * aiResponseTemplates.length)]
  return {
    id: crypto.randomUUID(),
    content: tpl.content,
    code: tpl.code,
    language: tpl.language,
    model: "devi-llm-1.0",
    tokens: rand(80, 450),
    latencyMs: rand(300, 2500),
    timestamp: new Date().toISOString(),
  }
}

export function generateSocketStats() {
  return {
    cpu: rand(20, 92),
    memory: rand(40, 88),
    disk: rand(35, 90),
    podsRunning: rand(40, 52),
    containersRunning: rand(5, 10),
    timestamp: new Date().toISOString(),
  }
}
