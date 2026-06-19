const ALLOWED_IMAGES = [
  "nginx", "nginx:alpine", "nginx:latest",
  "redis", "redis:7-alpine", "redis:latest",
  "mongo", "mongo:7", "mongo:latest",
  "postgres", "postgres:16-alpine", "postgres:latest",
  "mysql", "mysql:8", "mysql:latest",
  "mariadb", "mariadb:11", "mariadb:latest",
  "node", "node:20-alpine", "node:18-alpine", "node:latest",
  "python", "python:3.12-slim", "python:latest",
  "httpd", "httpd:2.4", "httpd:latest",
  "rabbitmq", "rabbitmq:4-management", "rabbitmq:latest",
  "elasticsearch", "elasticsearch:8.12", "elasticsearch:latest",
]

const BLOCKED_IMAGE_PATTERNS = [
  /ubuntu/i, /debian/i, /centos/i, /alpine/i,
  /scratch/i, /busybox/i, /bash/i, /sh/i, /shell/i,
]

export interface SafetyCheck {
  safe: boolean
  reason?: string
}

export function validateImage(image: string): SafetyCheck {
  const lower = image.toLowerCase()
  if (BLOCKED_IMAGE_PATTERNS.some((p) => p.test(lower))) {
    return { safe: false, reason: `Image "${image}" is not allowed. Bare OS images are blocked for security.` }
  }
  if (ALLOWED_IMAGES.some((a) => lower === a.toLowerCase() || lower.startsWith(a.toLowerCase().split(":")[0] + ":"))) {
    return { safe: true }
  }
  return { safe: false, reason: `Image "${image}" is not in the allowed list. Use a well-known service image.` }
}

export function validatePort(port: number): SafetyCheck {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { safe: false, reason: `Port ${port} is invalid. Must be between 1 and 65535.` }
  }
  if (port < 1024 && ![80, 443, 3000, 5000, 5432, 6379, 8080, 8443, 9200, 27017].includes(port)) {
    return { safe: false, reason: `Port ${port} is a privileged system port. Use a port >= 1024.` }
  }
  return { safe: true }
}

export function validateContainerName(name: string): SafetyCheck {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { safe: false, reason: `Container name "${name}" contains invalid characters. Use only letters, numbers, hyphens, and underscores.` }
  }
  if (name.length < 1 || name.length > 64) {
    return { safe: false, reason: `Container name must be between 1 and 64 characters.` }
  }
  const blockedNames = ["docker", "docker-compose", "devi-core", "system"]
  if (blockedNames.includes(name.toLowerCase())) {
    return { safe: false, reason: `Container name "${name}" is reserved for system use.` }
  }
  return { safe: true }
}

export function validateEnvVars(env: string[]): SafetyCheck {
  const blockedKeys = ["DOCKER_HOST", "DOCKER_CERT_PATH", "DOCKER_TLS_VERIFY", "PATH", "HOME", "SHELL"]
  for (const e of env) {
    const key = e.split("=")[0]
    if (blockedKeys.includes(key.toUpperCase())) {
      return { safe: false, reason: `Environment variable "${key}" is blocked for security.` }
    }
  }
  return { safe: true }
}

export function validateVolumes(volumes: string[]): SafetyCheck {
  for (const v of volumes) {
    const parts = v.split(":")
    if (parts.length < 2) continue
    const hostPath = parts[0]
    if (hostPath.startsWith("/") || hostPath.startsWith(".")) {
      const dangerous = ["/etc", "/var/run", "/proc", "/sys", "/dev", "/root", "/home", "/boot"]
      if (dangerous.some((d) => hostPath.startsWith(d) || hostPath.startsWith("." + d))) {
        return { safe: false, reason: `Volume mount "${hostPath}" exposes sensitive host paths. Blocked.` }
      }
    }
  }
  return { safe: true }
}

export const EXECUTION_TIMEOUT_MS = 120_000

export function validateDeployRequest(req: {
  image?: string
  name?: string
  ports?: { host: number; container: number }[]
  env?: string[]
  volumes?: string[]
}): SafetyCheck {
  if (req.image) {
    const imgCheck = validateImage(req.image)
    if (!imgCheck.safe) return imgCheck
  }
  if (req.name) {
    const nameCheck = validateContainerName(req.name)
    if (!nameCheck.safe) return nameCheck
  }
  if (req.ports) {
    for (const p of req.ports) {
      const hostCheck = validatePort(p.host)
      if (!hostCheck.safe) return hostCheck
      const containerCheck = validatePort(p.container)
      if (!containerCheck.safe) return containerCheck
    }
  }
  if (req.env) {
    const envCheck = validateEnvVars(req.env)
    if (!envCheck.safe) return envCheck
  }
  if (req.volumes) {
    const volCheck = validateVolumes(req.volumes)
    if (!volCheck.safe) return volCheck
  }
  return { safe: true }
}
