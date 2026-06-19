import Docker from "dockerode"
import { EventEmitter } from "events"
import { Readable } from "stream"

let dockerInstance: Docker | null = null
let connectionAttempted = false

export function getDocker(): Docker | null {
  if (!connectionAttempted) {
    connectionAttempted = true
    try {
      dockerInstance = new Docker()
      console.log("[Docker] Dockerode client initialized")
    } catch (err) {
      console.warn("[Docker] Failed to initialize Dockerode:", (err as Error).message)
    }
  }
  return dockerInstance
}

export async function isDockerReachable(): Promise<boolean> {
  try {
    const docker = getDocker()
    if (!docker) return false
    await docker.ping()
    return true
  } catch {
    return false
  }
}

export interface ContainerInfo {
  id: string
  name: string
  image: string
  status: string
  state: string
  created: string
  ports: { host: number; container: number; protocol: string }[]
  cpu: number
  memory: { used: number; limit: number }
  restartCount: number
  health: string
}

export interface ContainerStats {
  totalContainers: number
  running: number
  stopped: number
  paused: number
}

export async function listContainers(all = true): Promise<ContainerInfo[]> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const containers = await docker.listContainers({ all })
  const result: ContainerInfo[] = []

  for (const c of containers) {
    const names = c.Names || []
    const name = names[0]?.replace(/^\//, "") || "unknown"

    const ports = (c.Ports || [])
      .filter((p) => p.PublicPort)
      .map((p) => ({
        host: p.PublicPort!,
        container: p.PrivatePort,
        protocol: p.Type || "tcp",
      }))

    const health =
      c.Status?.includes("healthy")
        ? "healthy"
        : c.Status?.includes("unhealthy")
          ? "unhealthy"
          : c.State === "running"
            ? "healthy"
            : "unhealthy"

    result.push({
      id: c.Id,
      name,
      image: c.Image || "unknown",
      status: c.Status || "unknown",
      state: c.State || "unknown",
      created: new Date((c.Created || 0) * 1000).toISOString(),
      ports,
      cpu: 0,
      memory: { used: 0, limit: 0 },
      restartCount: (c as any).RestartCount || 0,
      health,
    })
  }

  return result
}

export async function getContainerStats(): Promise<ContainerStats> {
  const all = await listContainers(true)
  return {
    totalContainers: all.length,
    running: all.filter((c) => c.state === "running").length,
    stopped: all.filter((c) => c.state === "exited" || c.state === "stopped").length,
    paused: all.filter((c) => c.state === "paused").length,
  }
}

export async function restartContainer(idOrName: string): Promise<{ message: string }> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const container = docker.getContainer(idOrName)
  await container.restart()
  return { message: `Container ${idOrName} restarted successfully` }
}

export async function stopContainer(idOrName: string): Promise<{ message: string }> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const container = docker.getContainer(idOrName)
  await container.stop()
  return { message: `Container ${idOrName} stopped successfully` }
}

export async function startContainer(idOrName: string): Promise<{ message: string }> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const container = docker.getContainer(idOrName)
  await container.start()
  return { message: `Container ${idOrName} started successfully` }
}

export async function deployContainer(
  image: string,
  name?: string,
  portMappings?: { host: number; container: number }[],
  envVars?: string[],
): Promise<{ id: string; name: string; message: string }> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const containerName = name || `devi-${Math.random().toString(36).slice(2, 8)}`

  const portBindings: any = {}
  const exposedPorts: any = {}
  if (portMappings) {
    for (const p of portMappings) {
      const key = `${p.container}/tcp`
      exposedPorts[key] = {}
      portBindings[key] = [{ HostPort: String(p.host) }]
    }
  }

  const container = await docker.createContainer({
    Image: image,
    name: containerName,
    ExposedPorts: Object.keys(exposedPorts).length > 0 ? exposedPorts : undefined,
    Env: envVars,
    HostConfig: {
      PortBindings: Object.keys(portBindings).length > 0 ? portBindings : undefined,
    },
  })

  await container.start()

  return {
    id: container.id,
    name: containerName,
    message: `Container "${containerName}" deployed from image "${image}"`,
  }
}

export async function getContainerLogs(
  idOrName: string,
  tail = 100,
): Promise<{ timestamp: string; level: string; source: string; message: string }[]> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const container = docker.getContainer(idOrName)

  const lines: string[] = []

  const rawStream = (await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
  })) as unknown as Readable

  return new Promise((resolve, reject) => {
    let buffer = ""
    rawStream.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8")
      const parts = buffer.split("\n")
      buffer = parts.pop() || ""
      for (const line of parts) {
        const cleaned = line.replace(/^\u0000[\u0000-\u00FF]\u0000\u0000\u0000\u0000\u0000\u0000/, "").trim()
        if (cleaned) lines.push(cleaned)
      }
    })

    rawStream.on("end", () => {
      if (buffer.trim()) {
        lines.push(buffer.replace(/^\u0000[\u0000-\u00FF]\u0000\u0000\u0000\u0000\u0000\u0000/, "").trim())
      }
      const parsed = lines.map((l) => {
        const tsMatch = l.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z)\s*(.*)/)
        const timestamp = tsMatch?.[1] || new Date().toISOString()
        const message = tsMatch?.[2] || l
        const level = message.match(/\b(INFO|WARN|ERROR|DEBUG|FATAL)\b/i)?.[1]?.toUpperCase() || "INFO"
        return { timestamp, level, source: idOrName, message }
      })
      resolve(parsed)
    })

    rawStream.on("error", (err: Error) => reject(err))
  })
}

export async function removeContainer(idOrName: string): Promise<{ message: string }> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")
  const container = docker.getContainer(idOrName)
  await container.remove({ force: true })
  return { message: `Container ${idOrName} removed successfully` }
}

export async function buildImage(
  contextPath: string,
  tag: string,
  onProgress?: (msg: string) => void,
): Promise<string> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const fs = await import("fs")
  const path = await import("path")

  const tar = await import("tar")
  const tarStream = tar.c(
    { gzip: true, cwd: contextPath },
    fs.readdirSync(contextPath).filter((f: string) => f !== "node_modules" && f !== ".git" && !f.startsWith(".next") && f !== "dist"),
  )

  const stream = await docker.buildImage(tarStream as any, { t: tag })
  return new Promise((resolve, reject) => {
    let lastMessage = ""
    stream.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean)
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.stream) {
            lastMessage = parsed.stream.trim()
            onProgress?.(lastMessage)
          }
          if (parsed.error) reject(new Error(parsed.error))
        } catch { }
      }
    })
    stream.on("end", () => {
      if (lastMessage) onProgress?.("Build complete")
      resolve(tag)
    })
    stream.on("error", reject)
  })
}

export async function pullImage(image: string, onProgress?: (msg: string) => void): Promise<void> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const stream = await docker.pull(image)
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean)
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.status) onProgress?.(parsed.status)
          if (parsed.error) reject(new Error(parsed.error))
        } catch { }
      }
    })
    stream.on("end", resolve)
    stream.on("error", reject)
  })
}

export async function getContainerLogsStream(
  idOrName: string,
  onData: (line: string) => void,
): Promise<() => void> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const container = docker.getContainer(idOrName)
  const rawStream = (await container.logs({
    stdout: true,
    stderr: true,
    follow: true,
    tail: 10,
    timestamps: true,
  })) as unknown as Readable

  let buffer = ""
  const onChunk = (chunk: Buffer) => {
    buffer += chunk.toString("utf8")
    const parts = buffer.split("\n")
    buffer = parts.pop() || ""
    for (const line of parts) {
      const cleaned = line.replace(/^\u0000[\u0000-\u00FF]\u0000\u0000\u0000\u0000\u0000\u0000/, "").trim()
      if (cleaned) onData(cleaned)
    }
  }

  rawStream.on("data", onChunk)
  rawStream.on("error", () => { })

  return () => {
    rawStream.removeListener("data", onChunk)
    rawStream.destroy()
  }
}

export function generateComposeYaml(
  image: string,
  name: string,
  portMappings?: { host: number; container: number }[],
  envVars?: string[],
  volumes?: string[],
): string {
  const portStr = portMappings?.length
    ? portMappings.map((p) => `      - "${p.host}:${p.container}"`).join("\n")
    : ""
  const envStr = envVars?.length
    ? envVars.map((e) => `      - ${e}`).join("\n")
    : ""
  const volStr = volumes?.length
    ? volumes.map((v) => `      - ${v}`).join("\n")
    : ""

  return `version: "3.8"
services:
  ${name}:
    image: ${image}
    container_name: ${name}${portStr ? `\n    ports:\n${portStr}` : ""}${envStr ? `\n    environment:\n${envStr}` : ""}${volStr ? `\n    volumes:\n${volStr}` : ""}
    restart: unless-stopped`
}

export async function createContainerSimple(
  image: string,
  name: string,
  portMappings?: { host: number; container: number }[],
  envVars?: string[],
  volumes?: string[],
): Promise<{ id: string; name: string; message: string }> {
  const docker = getDocker()
  if (!docker) throw new Error("Docker not available")

  const portBindings: any = {}
  const exposedPorts: any = {}
  if (portMappings) {
    for (const p of portMappings) {
      const key = `${p.container}/tcp`
      exposedPorts[key] = {}
      portBindings[key] = [{ HostPort: String(p.host) }]
    }
  }

  const binds = volumes?.map((v) => {
    const parts = v.split(":")
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
    return undefined
  }).filter(Boolean) as string[] | undefined

  const container = await docker.createContainer({
    Image: image,
    name,
    ExposedPorts: Object.keys(exposedPorts).length > 0 ? exposedPorts : undefined,
    Env: envVars,
    HostConfig: {
      PortBindings: Object.keys(portBindings).length > 0 ? portBindings : undefined,
      Binds: binds,
      Privileged: false,
      ReadonlyRootfs: false,
    },
  })

  return {
    id: container.id,
    name,
    message: `Container "${name}" created from image "${image}"`,
  }
}

export async function generateDockerfile(projectType: string): Promise<string> {
  const templates: Record<string, string> = {
    node: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]`,
    "node-express": `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
    python: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]`,
    "python-flask": `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]`,
    nextjs: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]`,
    go: `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o server .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]`,
    rust: `FROM rust:1.77-slim AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/app .
EXPOSE 8080
CMD ["./app"]`,
  }
  return templates[projectType] || templates.node
}

export async function detectProjectType(projectPath: string): Promise<string> {
  const fs = await import("fs/promises")
  const path = await import("path")

  const absPath = path.resolve(projectPath)

  const files: string[] = []
  try {
    const entries = await fs.readdir(absPath)
    for (const e of entries) files.push(e.toLowerCase())
  } catch {
    return "node"
  }

  if (files.includes("package.json")) {
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(absPath, "package.json"), "utf-8"))
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (deps.next) return "nextjs"
      if (deps.express) return "node-express"
      return "node"
    } catch {
      return "node"
    }
  }
  if (files.includes("requirements.txt") || files.includes("setup.py") || files.includes("pyproject.toml")) {
    return "python"
  }
  if (files.includes("go.mod")) return "go"
  if (files.includes("cargo.toml")) return "rust"
  if (files.includes("index.html") || files.includes("composer.json")) return "node"
  if (files.includes("dockerfile") || files.includes("dockerfile.txt")) return "node"
  return "node"
}

