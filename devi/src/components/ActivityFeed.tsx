"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Cpu, Box, Terminal, Zap } from "lucide-react"
import { getSocket } from "@/lib/socket"

interface ActivityEvent {
  type: string
  message: string
  timestamp: string
}

const typeConfig: Record<string, { icon: typeof Activity; color: string }> = {
  system: { icon: Cpu, color: "#8aebff" },
  docker: { icon: Box, color: "#00f2ff" },
  k8s: { icon: Terminal, color: "#ddb7ff" },
  ai: { icon: Zap, color: "#d9e70d" },
}

export default function ActivityFeed({ maxItems = 20 }: { maxItems?: number }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])

  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()

    const handler = (event: ActivityEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, maxItems))
    }

    socket.on("activity:new", handler)
    return () => { socket.off("activity:new", handler) }
  }, [maxItems])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <AnimatePresence mode="popLayout">
        {events.map((e, i) => {
          const cfg = typeConfig[e.type] || { icon: Activity, color: "#bbc9cd" }
          const Icon = cfg.icon
          return (
            <motion.div
              key={e.timestamp + i}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, fontSize: 11, color: "#bbc9cd" }}
            >
              <Icon size={12} color={cfg.color} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message}</span>
              <span style={{ fontSize: 9, color: "#5a6a7a", flexShrink: 0 }}>
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {events.length === 0 && (
        <div style={{ padding: "12px 8px", fontSize: 11, color: "#5a6a7a", textAlign: "center" }}>
          Waiting for activity...
        </div>
      )}
    </div>
  )
}

