"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Play, Square, RotateCcw, Terminal, ChevronDown, Cpu, Box, Activity, AlertCircle, Plus, X,
} from "lucide-react"
import AppShell from "@/components/AppShell"
import { useToast } from "@/components/Toast"
import { dockerApi } from "@/lib/api"

const glass: React.CSSProperties = {
  background: "rgba(5, 5, 5, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.05)",
}

interface Container {
  id: string
  name: string
  image: string
  state: string
  status: string
  ports: { host: number; container: number; protocol: string }[]
  cpu: number
  memory: { used: number; limit: number }
  health: string
}

const mockLogs = [
  { time: "14:23:01.421", level: "info", tag: "INFO", msg: "Health check passed — 200 OK" },
  { time: "14:23:00.112", level: "warn", tag: "WARN", msg: "Memory threshold at 78% on node-3" },
  { time: "14:22:58.887", level: "info", tag: "INFO", msg: "Connection pool refreshed (12/12)" },
  { time: "14:22:55.003", level: "debug", tag: "DEBUG", msg: "gRPC request latencies — p50=2.1ms p99=14.7ms" },
  { time: "14:22:50.234", level: "info", tag: "INFO", msg: "Cache hit ratio: 0.94" },
  { time: "14:22:45.672", level: "error", tag: "ERROR", msg: "retry budget exhausted for upstream 'auth' after 3 attempts" },
  { time: "14:22:40.111", level: "info", tag: "INFO", msg: "Replica scaling: 6 -> 8 (cpu pressure)" },
  { time: "14:22:35.998", level: "debug", tag: "DEBUG", msg: "TLS handshake completed in 23ms" },
  { time: "14:22:30.550", level: "warn", tag: "WARN", msg: "Disk I/O latency spike — 142ms avg" },
  { time: "14:22:25.002", level: "info", tag: "INFO", msg: "Config revision applied: v2.4.1-rc3" },
]

const levelColor: Record<string, string> = {
  info: "text-cyan-400",
  warn: "text-purple-400",
  error: "text-red-400",
  debug: "text-lime-400",
}

export default function DockerPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [search, setSearch] = useState("")
  const [selectedContainer, setSelectedContainer] = useState<string>("api-gateway")
  const [logFilter, setLogFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ image: "", name: "", port: "" })
  const [creating, setCreating] = useState(false)
  const toast = useToast()

  const fetchContainers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dockerApi.list()
      setContainers(data.containers || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContainers() }, [])

  const handleCreate = async () => {
    if (!createForm.image.trim()) { toast.addToast("error", "Image required", "Enter an image name"); return }
    setCreating(true)
    try {
      const ports = createForm.port ? [{ host: parseInt(createForm.port), container: parseInt(createForm.port) }] : undefined
      await dockerApi.deploy(createForm.image.trim(), createForm.name.trim() || undefined, ports)
      toast.addToast("success", "Container created", `${createForm.name || createForm.image} deployed`)
      setShowCreate(false)
      setCreateForm({ image: "", name: "", port: "" })
      fetchContainers()
    } catch (err: any) {
      toast.addToast("error", "Failed", err.message)
    } finally {
      setCreating(false)
    }
  }

  const doAction = async (id: string, action: "restart" | "stop" | "start") => {
    setActionLoading(id)
    try {
      if (action === "restart") await dockerApi.restart(id)
      else if (action === "stop") await dockerApi.stop(id)
      else await dockerApi.start(id)
      toast.addToast("success", `Container ${action}ed`, `${id} ${action}ed successfully`)
      fetchContainers()
    } catch (err) {
      toast.addToast("error", `Failed to ${action} container`, (err as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = containers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const running = filtered.filter((c) => c.state === "running").length
  const stopped = filtered.filter((c) => c.state === "exited" || c.state === "stopped").length
  const total = filtered.length

  const filteredLogs: { time: string; level: string; tag: string; msg: string }[] = []

  return (
    <AppShell>
      <div className="flex min-h-screen" style={{ background: "#020617" }}>
        {/* ——— Main Content ——— */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#dce1fb", fontFamily: "Geist, sans-serif" }}>
                Container Swarm Overview
              </h1>
              <p className="text-xs mt-1" style={{ color: "#bbc9cd", fontFamily: "JetBrains Mono, monospace" }}>
                host.cluster.devi / docker
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  ...glass,
                  color: "#8aebff",
                  border: "1px solid rgba(138, 235, 255, 0.15)",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "#8aebff", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#8aebff" }} />
                </span>
                Running {running}/{total}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  ...glass,
                  color: "#ffb4ab",
                  border: "1px solid rgba(255, 0, 85, 0.15)",
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "#ffb4ab" }} />
                Stopped {stopped}/{total}
              </div>
            </div>
          </div>

          {/* Search + Create */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-80" style={glass}>
              <Search size={16} style={{ color: "#bbc9cd" }} />
              <input
                placeholder="Filter containers by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:opacity-40"
                style={{ color: "#dce1fb", fontFamily: "JetBrains Mono, monospace" }}
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #8aebff, #6f00be)",
                color: "white",
                boxShadow: "0 0 20px rgba(138,235,255,0.15)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(138,235,255,0.25)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(138,235,255,0.15)" }}
              title="Create container"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={glass}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ color: "#bbc9cd", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th className="text-left px-4 py-3 font-medium">Container Name</th>
                  <th className="text-left px-4 py-3 font-medium">Image / Tag</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Ports</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ delay: i * 0.02 }}
                      className="group cursor-pointer"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        background:
                          selectedContainer === c.name
                            ? "rgba(138, 235, 255, 0.04)"
                            : "transparent",
                      }}
                      onClick={() => setSelectedContainer(c.name)}
                      onMouseEnter={(e) => {
                        if (selectedContainer !== c.name)
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)"
                      }}
                      onMouseLeave={(e) => {
                        if (selectedContainer !== c.name)
                          e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Box size={14} style={{ color: "#8aebff" }} />
                          <span className="font-medium" style={{ color: "#dce1fb", fontFamily: "JetBrains Mono, monospace" }}>
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#bbc9cd", fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                        {c.image}
                      </td>
                      <td className="px-4 py-3">
                        {c.state === "running" ? (
                          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#8aebff" }}>
                            <span className="relative flex h-2 w-2">
                              <span
                                className="absolute inline-flex h-full w-full rounded-full opacity-75"
                                style={{ background: "#8aebff", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
                              />
                              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#8aebff" }} />
                            </span>
                            Running
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#ffb4ab" }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: "#ffb4ab" }} />
                            {c.state}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#bbc9cd", fontFamily: "JetBrains Mono, monospace" }}>
                        {c.ports?.map((p) => `${p.host}:${p.container}/${p.protocol}`).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ActionBtn icon={Play} label="Start" color="#8aebff" onClick={() => doAction(c.id || c.name, "start")} loading={actionLoading === (c.id || c.name)} />
                          <ActionBtn icon={Square} label="Stop" color="#ffb4ab" onClick={() => doAction(c.id || c.name, "stop")} loading={actionLoading === (c.id || c.name)} />
                          <ActionBtn icon={RotateCcw} label="Restart" color="#ddb7ff" onClick={() => doAction(c.id || c.name, "restart")} loading={actionLoading === (c.id || c.name)} />
                          <ActionBtn icon={Terminal} label="Logs" color="#8aebff" onClick={() => {}} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* ——— Logs Panel ——— */}
        <div
          className="w-96 hidden md:flex flex-col border-l"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            background: "rgba(5, 5, 5, 0.6)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: "#8aebff" }} />
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "#8aebff", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#8aebff" }} />
              </span>
              <span className="text-sm font-semibold" style={{ color: "#dce1fb" }}>
                Live Stream
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "#8aebff", background: "rgba(138,235,255,0.08)" }}>
                {selectedContainer}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: "#bbc9cd" }} />
          </div>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredLogs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="text-xs leading-relaxed font-mono"
                style={{ color: "#bbc9cd" }}
              >
                <span style={{ color: "#5a6a7a" }}>{log.time}</span>{" "}
                <span className={levelColor[log.level]}>{log.tag.padEnd(5)}</span>{" "}
                {log.msg}
              </motion.div>
            ))}
          </div>

          {/* Log filter */}
          <div
            className="flex items-center gap-2 px-3 py-2 m-3 rounded-lg shrink-0"
            style={glass}
          >
            <Search size={14} style={{ color: "#bbc9cd" }} />
            <input
              placeholder="Filter logs…"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="bg-transparent text-xs outline-none w-full placeholder:opacity-40"
              style={{ color: "#dce1fb", fontFamily: "JetBrains Mono, monospace" }}
            />
          </div>
        </div>

        {/* ——— Floating AI Command Bar ——— */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl"
          style={{
            ...glass,
            border: "1px solid rgba(138, 235, 255, 0.12)",
            boxShadow: "0 0 40px rgba(34, 211, 238, 0.08)",
          }}
        >
          <Cpu size={18} style={{ color: "#8aebff" }} />
          <span className="text-sm font-medium" style={{ color: "#dce1fb" }}>
            AI
          </span>
          <span className="text-xs" style={{ color: "#bbc9cd" }}>
            “restart api-gateway and scale to 4 replicas”
          </span>
          <kbd
            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
            style={{
              color: "#8aebff",
              background: "rgba(138, 235, 255, 0.08)",
              border: "1px solid rgba(138, 235, 255, 0.15)",
            }}
          >
            Enter
          </kbd>
        </motion.div>
      </div>

      {/* Create Container Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl p-6 w-full max-w-md"
              style={{
                background: "rgba(10, 10, 20, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 0 60px rgba(138,235,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: "#dce1fb" }}>Create Container</h2>
                <button onClick={() => setShowCreate(false)} style={{ color: "#bbc9cd", cursor: "pointer", background: "transparent", border: "none" }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#bbc9cd" }}>Image *</label>
                  <input
                    value={createForm.image}
                    onChange={(e) => setCreateForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="e.g. nginx:alpine, mongo:7, redis:7-alpine"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#dce1fb" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#bbc9cd" }}>Container Name</label>
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Optional — auto-generated if empty"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#dce1fb" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#bbc9cd" }}>Port</label>
                  <input
                    value={createForm.port}
                    onChange={(e) => setCreateForm(f => ({ ...f, port: e.target.value }))}
                    placeholder="e.g. 8080 (maps host:container)"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#dce1fb" }}
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.image.trim()}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200 mt-1"
                  style={{
                    background: "linear-gradient(135deg, #8aebff, #6f00be)",
                    color: "white",
                    opacity: creating || !createForm.image.trim() ? 0.5 : 1,
                    cursor: creating || !createForm.image.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating..." : "Create & Deploy"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  color,
  onClick,
  loading,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  color: string
  onClick?: () => void
  loading?: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="p-1.5 rounded-md transition-all"
      style={{
        background: hover ? `${color}12` : "transparent",
        color: hover ? color : "#bbc9cd",
        opacity: loading ? 0.5 : 1,
        cursor: loading ? "wait" : "pointer",
      }}
    >
      <Icon size={14} />
    </button>
  )
}





