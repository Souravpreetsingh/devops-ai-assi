"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Search, Terminal, Filter, Download, Clock } from "lucide-react"
import AppShell from "@/components/AppShell"
import { logsApi } from "@/lib/api"
import { getSocket } from "@/lib/socket"

const glass = {
  background: "rgba(5,5,5,0.6)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.05)",
}

const levelColors: Record<string, string> = {
  ERROR: "#ef4444",
  WARN: "#facc15",
  INFO: "#8aebff",
  DEBUG: "#818cf8",
}

export default function LogsPage() {
  const [lines, setLines] = useState<{ timestamp: string; level: string; message: string; source: string }[]>([])
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("ALL")
  const [source, setSource] = useState("api-gateway")
  const [sources, setSources] = useState<{ id: string; label: string }[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsApi.sources().then((data) => setSources(data.sources || [])).catch(() => {})
    refreshLogs()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()

    socket.emit("subscribe:logs", source)
    socket.on("logs:line", (line: { timestamp: string; level: string; message: string; source: string }) => {
      setLines((prev) => [...prev.slice(-499), line])
    })

    return () => { socket.off("logs:line") }
  }, [source])

  useEffect(() => {
    if (autoScroll) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [lines, autoScroll])

  const refreshLogs = async () => {
    try {
      const data = await logsApi.list(source, 50)
      setLines(data.lines || [])
    } catch {}
  }

  const filtered = lines.filter((l) => {
    if (levelFilter !== "ALL" && l.level !== levelFilter) return false
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div style={{ display: "flex", height: "100vh", background: "#020617", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", ...glass }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Terminal size={16} color="#8aebff" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#dce1fb" }}>Log Viewer</span>
            <select value={source} onChange={(e) => setSource(e.target.value)}
              style={{ background: "rgba(12,19,36,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 8px", color: "#8aebff", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", outline: "none" }}>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              {["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map((l) => (
                <button key={l} onClick={() => setLevelFilter(l)}
                  style={{
                    padding: "3px 10px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                    background: levelFilter === l ? "rgba(138,235,255,0.15)" : "transparent",
                    color: levelFilter === l ? "#8aebff" : "#5a6a7a",
                    border: "none", cursor: "pointer", borderRight: "1px solid rgba(255,255,255,0.06)",
                    fontWeight: levelFilter === l ? 700 : 400,
                  }}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={refreshLogs} style={{ padding: 6, background: "transparent", border: "none", color: "#5a6a7a", cursor: "pointer" }}>
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Log lines */}
        <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "12px 20px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: "flex", gap: 12, padding: "2px 0" }}>
                <span style={{ color: "#5a6a7a", flexShrink: 0, width: 80 }}>
                  {line.timestamp ? line.timestamp.slice(11, 19) : ""}
                </span>
                <span style={{ color: levelColors[line.level] || "#5a6a7a", flexShrink: 0, width: 48, fontWeight: 600 }}>
                  {line.level}
                </span>
                <span style={{ color: "#dce1fb", wordBreak: "break-all" }}>{line.message}</span>
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#5a6a7a", fontSize: 13 }}>
              No log entries match your filter
            </div>
          )}
        </div>

        {/* Search bar */}
        <div style={{ padding: "8px 20px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", ...glass }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(12,19,36,0.8)", borderRadius: 8, padding: "4px 12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search size={14} color="#5a6a7a" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search log messages..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#dce1fb", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}
            />
            <button onClick={() => setAutoScroll(!autoScroll)}
              style={{ padding: 4, background: autoScroll ? "rgba(138,235,255,0.1)" : "transparent", border: "none", color: autoScroll ? "#8aebff" : "#5a6a7a", cursor: "pointer", borderRadius: 4 }}>
              <Clock size={14} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}




