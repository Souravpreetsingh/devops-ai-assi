import { Server as SocketIOServer, Socket } from "socket.io"
import { getSystemStats, generateActivity } from "../services/system.js"
import { streamCommand, validateCommand } from "../services/shell.js"
import { getLogStream } from "../services/logs.js"
import { getContainerLogsStream } from "../services/docker.js"

const activeStreams = new Map<string, { abort: () => void }>()
const logStreamCleanups = new Map<string, () => void>()

function emitActivity(io: SocketIOServer, activity: { type: string; message: string; timestamp: string }) {
  io.emit("activity:new", activity)
}

function emitDeployment(io: SocketIOServer, event: { type: string; message: string; timestamp: string; data?: any }) {
  io.emit("deployment:event", event)
  emitActivity(io, { type: "docker", message: event.message, timestamp: event.timestamp })
}

export function setupSocketHandlers(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`)

    let statsInterval: NodeJS.Timeout | null = null

    socket.on("subscribe:stats", () => {
      statsInterval = setInterval(async () => {
        try {
          const stats = await getSystemStats()
          socket.emit("system:update", stats)
          emitActivity(io, { type: "system", message: `CPU: ${stats.cpu.usage}%, RAM: ${stats.memory.percent}%`, timestamp: new Date().toISOString() })
        } catch {
          // fallback
        }
      }, 2000)
    })

    socket.on("subscribe:logs", (source: string) => {
      const stream = getLogStream(source)
      const logInterval = setInterval(() => {
        const lines = stream()
        if (lines.length > 0) {
          lines.forEach((line) => socket.emit("logs:line", line))
        }
      }, 2000)

      socket.on("disconnect", () => clearInterval(logInterval))
    })

    socket.on("terminal:input", (data: { command: string }) => {
      const validation = validateCommand(data.command)
      if (!validation.valid) {
        socket.emit("terminal:output", { type: "error", data: `\u2716 ${validation.error}\n` })
        return
      }

      socket.emit("terminal:output", { type: "stdout", data: `$ ${data.command}\n` })

      const stream = streamCommand(
        data.command,
        (out) => socket.emit("terminal:output", { type: "stdout", data: out }),
        (err) => socket.emit("terminal:output", { type: "stderr", data: err }),
        (code) => {
          socket.emit("terminal:output", { type: "stdout", data: `\nProcess exited with code ${code}\n` })
          activeStreams.delete(socket.id)
        },
      )

      activeStreams.set(socket.id, stream)
    })

    socket.on("terminal:abort", () => {
      const stream = activeStreams.get(socket.id)
      if (stream) {
        stream.abort()
        activeStreams.delete(socket.id)
        socket.emit("terminal:output", { type: "stdout", data: "\n\u2716 Command aborted\n" })
      }
    })

    socket.on("deployment:subscribe", () => {
      socket.join("deployment-updates")
    })

    socket.on("deployment:unsubscribe", () => {
      socket.leave("deployment-updates")
    })

    socket.on("deployment:logs", async (containerId: string) => {
      const cleanup = logStreamCleanups.get(socket.id)
      if (cleanup) cleanup()

      try {
        const stop = await getContainerLogsStream(containerId, (line) => {
          socket.emit("deployment:log", { containerId, line, timestamp: new Date().toISOString() })
        })
        logStreamCleanups.set(socket.id, stop)
      } catch {
        socket.emit("deployment:log", { containerId, line: "Unable to stream logs for this container", timestamp: new Date().toISOString() })
      }
    })

    socket.on("deployment:logs:stop", () => {
      const cleanup = logStreamCleanups.get(socket.id)
      if (cleanup) cleanup()
      logStreamCleanups.delete(socket.id)
    })

    socket.on("unsubscribe:stats", () => {
      if (statsInterval) clearInterval(statsInterval)
    })

    socket.on("disconnect", () => {
      console.log(`[WS] Client disconnected: ${socket.id}`)
      if (statsInterval) clearInterval(statsInterval)
      const stream = activeStreams.get(socket.id)
      if (stream) stream.abort()
      activeStreams.delete(socket.id)
      const cleanup = logStreamCleanups.get(socket.id)
      if (cleanup) cleanup()
      logStreamCleanups.delete(socket.id)
    })
  })
}
