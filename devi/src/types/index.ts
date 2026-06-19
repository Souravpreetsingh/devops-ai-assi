export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: { rx: number; tx: number }
}

export interface Container {
  id: string
  name: string
  image: string
  status: "running" | "stopped" | "restarting"
  ports: string
}

export interface Pod {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
}

export interface Deployment {
  name: string
  replicas: number
  available: number
  status: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}
