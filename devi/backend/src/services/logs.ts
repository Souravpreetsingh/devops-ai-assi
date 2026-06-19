import { generateLogLines } from "../data/mock.js"

const logSubscribers = new Map<string, number>()

export function getLogStream(source: string): () => { timestamp: string; level: string; source: string; message: string }[] {
  let lastCount = 0

  return () => {
    const lines = generateLogLines(source, 5)
    lastCount += lines.length
    return lines
  }
}

export function parseLogLevel(level: string): "info" | "warn" | "error" | "debug" {
  const upper = level.toUpperCase()
  if (upper === "ERROR" || upper === "FATAL") return "error"
  if (upper === "WARN") return "warn"
  if (upper === "DEBUG") return "debug"
  return "info"
}
