"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  Rocket, Terminal, Box, Database, Server, Globe, Cpu,
  Activity, CheckCircle, XCircle, Clock, Play, StopCircle,
  RefreshCw, ChevronRight, ChevronDown, Layers,
  Code, Zap, Loader2, Sparkles,
} from "lucide-react"
import AppShell from "@/components/AppShell"
import HolographicCard from "@/components/HolographicCard"
import GlassCard from "@/components/GlassCard"
import { deployApi, dockerApi } from "@/lib/api"
import { getSocket } from "@/lib/socket"

const colors = {
  surfaceBase: "#020617",
  primary: "#8aebff",
  onSurface: "#dce1fb",
  onSurfaceVariant: "rgba(255,255,255,0.4)",
  success: "#4ade80",
  error: "#ffb4ab",
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

interface DeployLog {
  id: string
  message: string
  timestamp: string
  type: "info" | "success" | "error" | "progress"
}

interface Container {
  id: string
  name: string
  image: string
  state: string
  status: string
  ports: { host: number; container: number }[]
}

const QUICK_TEMPLATES = [
  { label: "MongoDB", icon: Database, image: "mongo:7", port: 27017, color: "#4ade80" },
  { label: "Redis", icon: Cpu, image: "redis:7-alpine", port: 6379, color: "#facc15" },
  { label: "Nginx", icon: Globe, image: "nginx:alpine", port: 80, color: "#8aebff" },
  { label: "PostgreSQL", icon: Database, image: "postgres:16-alpine", port: 5432, color: "#ddb7ff" },
  { label: "Node.js", icon: Box, image: "node:20-alpine", port: 3000, color: "#4ade80" },
  { label: "MySQL", icon: Database, image: "mysql:8", port: 3306, color: "#facc15" },
]

const STACK_TEMPLATES = [
  { label: "MERN Stack", stack: "mern", icon: Layers, description: "MongoDB + Express + React + Node.js", color: "#8aebff" },
  { label: "LAMP Stack", stack: "lamp", icon: Layers, description: "Linux + Apache + MySQL + PHP", color: "#ddb7ff" },
  { label: "Redis Stack", stack: "redis", icon: Layers, description: "Redis with persistence", color: "#facc15" },
]

function formatTime(ts: string) { return new Date(ts).toLocaleTimeString() }

export default function DeployPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [deployLogs, setDeployLogs] = useState<DeployLog[]>([])
  const [aiInput, setAiInput] = useState("")
  const [deploying, setDeploying] = useState(false)
  const [activeTab, setActiveTab] = useState<"containers" | "logs" | "compose">("containers")
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null)
  const [containerLogs, setContainerLogs] = useState<Record<string, string[]>>({})
  const [selectedStack, setSelectedStack] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [deployingStack, setDeployingStack] = useState(false)
  const [activeDeployments, setActiveDeployments] = useState<string[]>([])

  const addLog = useCallback((msg: string, type: DeployLog["type"] = "info") => {
    setDeployLogs(prev => [{ id: Date.now().toString() + Math.random(), message: msg, timestamp: new Date().toISOString(), type }, ...prev].slice(0, 100))
  }, [])

  const fetchContainers = useCallback(async () => {
    try {
      const result = await dockerApi.list()
      const list = result.containers || result || []
      setContainers(Array.isArray(list) ? list : [])
    } catch { addLog("Failed to fetch containers", "error") }
  }, [addLog])

  useEffect(() => { fetchContainers(); const i = setInterval(fetchContainers, 5000); return () => clearInterval(i) }, [fetchContainers])

  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()
    socket.emit("deployment:subscribe")
    const handleEvent = (event: { type: string; message: string; timestamp: string }) => {
      addLog(event.message, event.type === "error" ? "error" : event.type === "success" ? "success" : "progress")
      if (event.type === "success" || event.type === "error") fetchContainers()
    }
    const handleLog = (data: { containerId: string; line: string; timestamp: string }) => {
      setContainerLogs(prev => ({ ...prev, [data.containerId]: [...(prev[data.containerId] || []).slice(-100), `[${formatTime(data.timestamp)}] ${data.line}`] }))
    }
    socket.on("deployment:event", handleEvent)
    socket.on("deployment:progress", (msg: { message: string }) => addLog(msg.message, "progress"))
    socket.on("deployment:log", handleLog)
    return () => { socket.off("deployment:event", handleEvent); socket.off("deployment:progress"); socket.off("deployment:log") }
  }, [addLog, fetchContainers])

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [deployLogs])

  const handleQuickDeploy = async (template: typeof QUICK_TEMPLATES[0]) => {
    setDeploying(true)
    addLog(`Deploying ${template.label} (${template.image})...`, "progress")
    try {
      const name = template.label.toLowerCase()
      const result = await deployApi.deploy(template.image, name, [{ host: template.port, container: template.port }])
      addLog(`${template.label} deployed: ${result.message}`, "success")
      setActiveDeployments(prev => [...prev, name])
      fetchContainers()
    } catch (err: any) { addLog(`Failed: ${err.message}`, "error") }
    finally { setDeploying(false) }
  }

  const handleStackDeploy = async (stack: { label: string; stack: string }) => {
    setDeployingStack(true); setSelectedStack(stack.stack)
    addLog(`Deploying ${stack.label}...`, "progress")
    try {
      const result = await deployApi.compose(stack.stack)
      addLog(`${stack.label}: ${result.message}`, "success"); fetchContainers()
    } catch (err: any) { addLog(`Stack failed: ${err.message}`, "error") }
    finally { setDeployingStack(false) }
  }

  const handleAiDeploy = async () => {
    if (!aiInput.trim() || deploying) return
    const text = aiInput.trim(); setAiInput(""); setDeploying(true)
    addLog(`Parsing: "${text}"`, "info")
    try {
      const parsed = await deployApi.parse(text)
      addLog(`Interpreted: ${parsed.action} ${parsed.image || parsed.stack || ""}`, "info")
      if (parsed.action === "compose" && parsed.stack) {
        addLog(`Deploying ${parsed.stack} stack...`, "progress")
        const result = await deployApi.compose(parsed.stack)
        addLog(result.message, "success")
      } else if (parsed.action === "containerize") {
        addLog(`Containerizing...`, "progress")
        const result = await deployApi.containerize(parsed.projectPath)
        addLog(`Type: ${result.projectType}`, "info"); addLog(result.message, "success")
      } else {
        const name = parsed.name || text.split(" ").pop() || "app"
        addLog(`Deploying ${parsed.image} as "${name}"...`, "progress")
        const result = await deployApi.deploy(parsed.image!, name, parsed.ports.length > 0 ? parsed.ports : undefined, parsed.env)
        addLog(result.message, "success")
      }
      fetchContainers()
    } catch (err: any) { addLog(`Deployment failed: ${err.message}`, "error") }
    finally { setDeploying(false) }
  }

  const handleContainerAction = async (id: string, action: "start" | "stop" | "restart") => {
    try {
      addLog(`${action} container ${id.slice(0, 12)}...`, "progress")
      if (action === "start") await dockerApi.start(id)
      else if (action === "stop") await dockerApi.stop(id)
      else if (action === "restart") await dockerApi.restart(id)
      addLog(`Container ${action}ed`, "success"); fetchContainers()
    } catch (err: any) { addLog(`Failed: ${err.message}`, "error") }
  }

  const toggleContainerLogs = async (id: string) => {
    if (expandedContainer === id) { setExpandedContainer(null); return }
    setExpandedContainer(id)
    try {
      const result = await deployApi.logs(id, 50)
      setContainerLogs(prev => ({ ...prev, [id]: (result.lines || []).map((l: any) => `[${l.timestamp?.slice(11, 19) || "?"}] [${l.level}] ${l.message}`) }))
    } catch { setContainerLogs(prev => ({ ...prev, [id]: ["Unable to fetch logs"] })) }
  }

  return (
    <AppShell>
      <div style={{ padding: "24px", minHeight: "100vh", background: colors.surfaceBase, color: colors.onSurface }}>
        <motion.div {...fadeUp} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Rocket size={24} color={colors.primary} />
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: colors.onSurface, letterSpacing: "-0.02em" }}>Deploy</h1>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: colors.onSurfaceVariant }}>AI-powered container deployment</p>
              </div>
            </div>
            <button onClick={fetchContainers}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: colors.onSurfaceVariant, fontSize: "11px", cursor: "pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* AI Input */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }} style={{ marginBottom: "20px" }}>
          <GlassCard className="p-3.5">
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Sparkles size={16} color={colors.primary} style={{ flexShrink: 0 }} />
              <input value={aiInput} onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiDeploy() } }}
                placeholder='Ask Devi to deploy — "Deploy MongoDB on port 27017", "Deploy MERN stack"'
                style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px", color: colors.onSurface, fontSize: "12px", outline: "none" }}
              />
              <button onClick={handleAiDeploy} disabled={!aiInput.trim() || deploying}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: deploying ? "rgba(138,235,255,0.15)" : "linear-gradient(135deg, #8aebff, #6f00be)", color: "white", fontSize: "12px", fontWeight: 600, cursor: deploying || !aiInput.trim() ? "not-allowed" : "pointer", opacity: deploying || !aiInput.trim() ? 0.4 : 1 }}>
                {deploying ? <Loader2 size={14} className="animate-spin" /> : "Deploy"}
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Deploy */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.1 }} style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 600, margin: "0 0 10px", color: colors.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Deploy</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
            {QUICK_TEMPLATES.map((t) => (
              <motion.button key={t.label} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickDeploy(t)} disabled={deploying}
                style={{ padding: "14px 8px", borderRadius: "10px", border: `1px solid ${t.color}18`, background: `${t.color}06`, color: colors.onSurface, cursor: deploying ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", opacity: deploying ? 0.4 : 1 }}>
                <t.icon size={22} color={t.color} />
                <span style={{ fontSize: "11px", fontWeight: 600 }}>{t.label}</span>
                <span style={{ fontSize: "9px", color: colors.onSurfaceVariant }}>:{t.port}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Stack Deploy */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.15 }} style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 600, margin: "0 0 10px", color: colors.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stack Deploy</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {STACK_TEMPLATES.map((s) => (
              <motion.button key={s.label} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleStackDeploy(s)} disabled={deployingStack}
                style={{ padding: "14px", borderRadius: "10px", border: selectedStack === s.stack ? `1px solid ${s.color}` : `1px solid ${s.color}15`, background: selectedStack === s.stack ? `${s.color}10` : `${s.color}04`, color: colors.onSurface, cursor: deployingStack ? "not-allowed" : "pointer", textAlign: "left", opacity: deployingStack ? 0.4 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <s.icon size={18} color={s.color} />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{s.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: "10px", color: colors.onSurfaceVariant }}>{s.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main area */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.2 }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {(["containers", "logs", "compose"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: activeTab === tab ? "rgba(138,235,255,0.08)" : "transparent", color: activeTab === tab ? colors.primary : colors.onSurfaceVariant, fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
            <GlassCard className="p-5" glow="cyan">
              {activeTab === "containers" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Containers</h2>
                    <span style={{ fontSize: "10px", color: colors.onSurfaceVariant }}>{containers.length} total</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "420px", overflowY: "auto" }}>
                    {containers.map((c) => (
                      <div key={c.id}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
                          onClick={() => toggleContainerLogs(c.id)}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                            <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: c.state === "running" ? colors.success : colors.error, boxShadow: c.state === "running" ? "0 0 8px rgba(74,222,128,0.5)" : "none" }}
                              animate={c.state === "running" ? { opacity: [1, 0.4, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: colors.onSurface }}>{c.name || c.id.slice(0, 12)}</div>
                              <div style={{ fontSize: "10px", color: colors.onSurfaceVariant }}>{c.image} &middot; {c.status}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "3px" }} onClick={(e) => e.stopPropagation()}>
                            {c.state !== "running" && (
                              <button onClick={() => handleContainerAction(c.id, "start")} title="Start" style={{ padding: "3px 6px", borderRadius: "4px", border: "none", background: "rgba(74,222,128,0.08)", color: colors.success, cursor: "pointer" }}>
                                <Play size={10} />
                              </button>
                            )}
                            {c.state === "running" && (
                              <button onClick={() => handleContainerAction(c.id, "stop")} title="Stop" style={{ padding: "3px 6px", borderRadius: "4px", border: "none", background: "rgba(255,180,171,0.08)", color: colors.error, cursor: "pointer" }}>
                                <StopCircle size={10} />
                              </button>
                            )}
                            <button onClick={() => handleContainerAction(c.id, "restart")} title="Restart" style={{ padding: "3px 6px", borderRadius: "4px", border: "none", background: "rgba(250,204,21,0.08)", color: "#facc15", cursor: "pointer" }}>
                              <RefreshCw size={10} />
                            </button>
                          </div>
                          {expandedContainer === c.id ? <ChevronDown size={12} style={{ marginLeft: 6 }} /> : <ChevronRight size={12} style={{ marginLeft: 6 }} />}
                        </div>
                        {expandedContainer === c.id && (
                          <div style={{ marginLeft: "20px", padding: "6px 10px", background: "rgba(0,0,0,0.25)", borderRadius: "4px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: colors.onSurfaceVariant, maxHeight: "150px", overflowY: "auto", lineHeight: 1.4 }}>
                            {(containerLogs[c.id] || ["Click to load logs..."]).map((line, i) => (<div key={i}>{line}</div>))}
                          </div>
                        )}
                      </div>
                    ))}
                    {containers.length === 0 && (
                      <div style={{ textAlign: "center", padding: "32px 0", color: colors.onSurfaceVariant }}>
                        <Box size={28} style={{ margin: "0 auto 6px", opacity: 0.2 }} />
                        <p style={{ fontSize: "12px" }}>No containers running</p>
                        <p style={{ fontSize: "10px" }}>Use quick deploy or ask Devi</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px", color: colors.onSurface }}>Deployment Logs</h2>
                  <div style={{ maxHeight: "420px", overflowY: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", lineHeight: 1.5 }}>
                    {deployLogs.map((log) => (
                      <div key={log.id} style={{ padding: "3px 6px", borderRadius: "3px", color: log.type === "error" ? colors.error : log.type === "success" ? colors.success : log.type === "progress" ? colors.primary : colors.onSurfaceVariant }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>[{formatTime(log.timestamp)}]</span> {log.message}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}

              {activeTab === "compose" && (
                <div>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px", color: colors.onSurface }}>Compose Files</h2>
                  <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                    {STACK_TEMPLATES.map((s) => (
                      <div key={s.stack} style={{ marginBottom: "10px", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: colors.onSurface }}>{s.label}</span>
                          <button onClick={() => handleStackDeploy(s)} style={{ padding: "3px 10px", borderRadius: "4px", border: "1px solid rgba(138,235,255,0.15)", background: "transparent", color: colors.primary, fontSize: "10px", cursor: "pointer" }}>Deploy</button>
                        </div>
                        <pre style={{ margin: 0, fontSize: "9px", color: colors.onSurfaceVariant, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.3, maxHeight: "100px", overflow: "auto" }}>
                          {`version: "3.8"\nservices:\n  ${s.stack}:\n    ...`}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Right panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <GlassCard className="p-4" glow="purple">
                <h3 style={{ fontSize: "11px", fontWeight: 600, margin: "0 0 10px", color: colors.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { label: "Running", value: containers.filter(c => c.state === "running").length, color: colors.success },
                    { label: "Stopped", value: containers.filter(c => c.state !== "running").length, color: colors.error },
                    { label: "Active Deployments", value: activeDeployments.length, color: colors.primary },
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.02)" }}>
                      <span style={{ fontSize: "11px", color: colors.onSurfaceVariant }}>{s.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-4" glow="cyan">
                <h3 style={{ fontSize: "11px", fontWeight: 600, margin: "0 0 10px", color: colors.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>Activity</h3>
                <div style={{ maxHeight: "220px", overflowY: "auto", fontSize: "10px", lineHeight: 1.5 }}>
                  {deployLogs.slice(0, 12).map((log) => (
                    <div key={log.id} style={{ padding: "2px 0", color: log.type === "error" ? colors.error : log.type === "success" ? colors.success : colors.onSurfaceVariant }}>
                      {log.message}
                    </div>
                  ))}
                  {deployLogs.length === 0 && <div style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", padding: "16px 0" }}>No activity yet</div>}
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
