export interface ParsedDeployCommand {
  action: "run" | "compose" | "containerize" | "build"
  image?: string
  name?: string
  ports: { host: number; container: number }[]
  env: string[]
  volumes: string[]
  network?: string
  stack?: string
  projectPath?: string
  confidence: number
}

const STACK_TEMPLATES: Record<string, { services: { image: string; name: string; ports?: string; env?: string[] }[]; compose: string }> = {
  mern: {
    services: [
      { image: "mongo:7", name: "mongodb", ports: "27017:27017" },
      { image: "node:20-alpine", name: "backend", ports: "5000:5000", env: ["MONGO_URI=mongodb://mongodb:27017/app"] },
      { image: "node:20-alpine", name: "frontend", ports: "3000:3000" },
    ],
    compose: `version: "3.8"
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]
  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment: [MONGO_URI=mongodb://mongodb:27017/app]
    depends_on: [mongodb]
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
volumes: { mongo-data: {} }`,
  },
  lamp: {
    services: [
      { image: "httpd:2.4", name: "apache", ports: "80:80" },
      { image: "mysql:8", name: "mysql", ports: "3306:3306", env: ["MYSQL_ROOT_PASSWORD=root"] },
      { image: "php:8.2-apache", name: "php-app", ports: "8080:80" },
    ],
    compose: `version: "3.8"
services:
  apache:
    image: httpd:2.4
    ports: ["80:80"]
    volumes: [./www:/usr/local/apache2/htdocs]
  mysql:
    image: mysql:8
    ports: ["3306:3306"]
    environment: [MYSQL_ROOT_PASSWORD=root]
    volumes: [mysql-data:/var/lib/mysql]
  php-app:
    image: php:8.2-apache
    ports: ["8080:80"]
    volumes: [./www:/var/www/html]
volumes: { mysql-data: {} }`,
  },
  redis: {
    services: [
      { image: "redis:7-alpine", name: "redis", ports: "6379:6379" },
    ],
    compose: `version: "3.8"
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis-data:/data]
    command: redis-server --appendonly yes
volumes: { redis-data: {} }`,
  },
  postgres: {
    services: [
      { image: "postgres:16-alpine", name: "postgres", ports: "5432:5432", env: ["POSTGRES_PASSWORD=postgres", "POSTGRES_DB=app"] },
    ],
    compose: `version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment: [POSTGRES_PASSWORD=postgres, POSTGRES_DB=app]
    volumes: [pg-data:/var/lib/postgresql/data]
volumes: { pg-data: {} }`,
  },
}

const WELL_KNOWN_IMAGES: Record<string, { image: string; defaultPort: number; env?: string[] }> = {
  nginx: { image: "nginx:alpine", defaultPort: 80 },
  redis: { image: "redis:7-alpine", defaultPort: 6379 },
  mongo: { image: "mongo:7", defaultPort: 27017 },
  mongodb: { image: "mongo:7", defaultPort: 27017 },
  postgres: { image: "postgres:16-alpine", defaultPort: 5432 },
  postgresql: { image: "postgres:16-alpine", defaultPort: 5432 },
  mysql: { image: "mysql:8", defaultPort: 3306 },
  mariadb: { image: "mariadb:11", defaultPort: 3306 },
  node: { image: "node:20-alpine", defaultPort: 3000 },
  python: { image: "python:3.12-slim", defaultPort: 8000 },
  flask: { image: "python:3.12-slim", defaultPort: 5000 },
  express: { image: "node:20-alpine", defaultPort: 3000 },
  rabbitmq: { image: "rabbitmq:4-management", defaultPort: 5672 },
  elasticsearch: { image: "elasticsearch:8.12", defaultPort: 9200 },
  "httpd": { image: "httpd:2.4", defaultPort: 80 },
  "apache": { image: "httpd:2.4", defaultPort: 80 },
}

function extractPort(text: string): number | undefined {
  const match = text.match(/port\s+(\d+)/i) || text.match(/(\d+)(?:\s*:\s*\d+)?/)
  if (match) {
    const port = parseInt(match[1], 10)
    if (port > 0 && port < 65536) return port
  }
  return undefined
}

function extractName(text: string, imageName: string): string | undefined {
  const match = text.match(/(?:named?|called)\s+["']?([a-zA-Z0-9_-]+)["']?/i)
  if (match) return match[1]
  return undefined
}

function extractImage(text: string): string | undefined {
  const knownKeys = Object.keys(WELL_KNOWN_IMAGES)
  for (const key of knownKeys) {
    if (text.toLowerCase().includes(key)) return key
  }
  const match = text.match(/(?:from|using|image)\s+["']?([a-zA-Z0-9_.\/:-]+)["']?/i)
  if (match) return match[1]
  return undefined
}

function extractEnv(text: string): string[] {
  const envs: string[] = []
  const matches = text.matchAll(/(\w+)=(?:["']?([^"'\s]+)["']?)?/g)
  for (const m of matches) {
    if (m[1] && !["port", "deploy", "create", "run", "container", "named", "called"].includes(m[1].toLowerCase())) {
      envs.push(`${m[1]}=${m[2] || ""}`)
    }
  }
  return envs
}

function detectStack(text: string): string | undefined {
  const lower = text.toLowerCase()
  const stackMap: Record<string, string> = {
    "mern": "mern",
    "m.e.r.n": "mern",
    "mean": "mern",
    "lamp": "lamp",
    "l.a.m.p": "lamp",
    "lemp": "lamp",
    "redis stack": "redis",
    "postgres stack": "postgres",
    "elk": "elasticsearch",
  }
  for (const [key, value] of Object.entries(stackMap)) {
    if (lower.includes(key)) return value
  }
  return undefined
}

export function parseDeployCommand(text: string): ParsedDeployCommand {
  const lower = text.toLowerCase()

  const stack = detectStack(text)
  if (stack) {
    return {
      action: "compose",
      stack,
      ports: [],
      env: [],
      volumes: [],
      confidence: 0.9,
    }
  }

  if (/containerize/i.test(lower) || /dockerize/i.test(lower) || /build.*image/i.test(lower)) {
    const pathMatch = text.match(/(?:from|at|in|path)\s+["']?([a-zA-Z0-9_\/\\.-]+)["']?/i)
    return {
      action: "containerize",
      projectPath: pathMatch?.[1] || ".",
      ports: [],
      env: [],
      volumes: [],
      confidence: 0.85,
    }
  }

  const imageKey = extractImage(text)
  if (!imageKey) {
    return {
      action: "run",
      image: "nginx:alpine",
      name: "web-server",
      ports: [{ host: 80, container: 80 }],
      env: [],
      volumes: [],
      confidence: 0.4,
    }
  }

  const knownImage = WELL_KNOWN_IMAGES[imageKey]
  const image = knownImage?.image || imageKey
  const providedPort = extractPort(text)
  const defaultPort = knownImage?.defaultPort || 80
  const containerPort = providedPort || defaultPort

  const hostPortMatch = text.match(/(\d+):(\d+)/)
  const hostPort = hostPortMatch ? parseInt(hostPortMatch[1], 10) : containerPort

  const name = extractName(text, imageKey) || imageKey
  const env = extractEnv(text)
  if (knownImage?.env) env.push(...knownImage.env)

  return {
    action: "run",
    image,
    name,
    ports: [{ host: hostPort, container: containerPort }],
    env,
    volumes: [],
    confidence: 0.85,
  }
}

export function getStackTemplate(stack: string): { services: { image: string; name: string; ports?: string; env?: string[] }[]; compose: string } | undefined {
  return STACK_TEMPLATES[stack]
}
