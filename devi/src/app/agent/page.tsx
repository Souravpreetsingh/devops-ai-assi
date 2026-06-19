"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Brain, AlertTriangle, CheckCircle, XCircle, Shield, Activity,
  Cpu, RotateCcw, Zap, Lightbulb, RefreshCw, Bot
} from "lucide-react"
import AppShell from "@/components/AppShell"
import HolographicCard from "@/components/HolographicCard"
import { useToast } from "@/components/Toast"
import { agentApi, systemApi, dockerApi, kubernetesApi } from "@/lib/api"

const colors = {
  surfaceBase: "#020617",
  primary: "#8aebff",
  secondary: "#ddb7ff",
  onSurface: "#dce1fb",
  onSurfaceVariant: "#bbc9cd",
  error: "#ffb4ab",
  tertiary: "#d9e70d",
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export default function AgentPage() {
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [scanning, setScanning] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [agentLog, setAgentLog] = useState<string[]>([])
  const toast = useToast()
  const router = useRouter()

  const addLog = (msg: string) => {
    setAgentLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50))
  }

  const scanForAnomalies = useCallback(async () => {
    setScanning(true)
    addLog("🔍 Scanning system for anomalies...")
    try {
      const stats = await systemApi.stats().catch(() => null)
      const containers = await dockerApi.list().catch(() => [])
      const k8s = await kubernetesApi.pods().catch(() => ({ pods: [] }))

      const allAnomalies: any[] = []

      // System anomalies
      if (stats) {
        const sysResult = await agentApi.anomalies("system", {
          cpu: stats.cpu?.usage || 0,
          memory: stats.memory?.percent || 0,
          disk: stats.disk?.percent || 0,
        }).catch(() => ({ anomalies: [] }))
        allAnomalies.push(...(sysResult.anomalies || []))
      }

      // Docker container anomalies
      for (const c of (containers.containers || containers || [])) {
        if (c.state === "exited" || (c.status && c.status.includes("restart"))) {
          allAnomalies.push({
            id: Math.random().toString(36).slice(2),
            type: "container_restart_loop",
            severity: "warning",
            service: c.names || c.name || "container",
            message: `Container "${c.names || c.name}" is in ${c.state || c.status} state`,
            suggestion: `Check logs and restart the container`,
            autoFixable: true,
            timestamp: new Date().toISOString(),
            detected: true,
          })
        }
      }

      // K8s pod anomalies
      const failedPods = (k8s.pods || []).filter((p: any) => p.status === "Failed" || p.status === "Pending")
      for (const p of failedPods.slice(0, 5)) {
        allAnomalies.push({
          id: Math.random().toString(36).slice(2),
          type: "container_restart_loop",
          severity: p.status === "Failed" ? "critical" : "warning",
          service: p.name,
          message: `Pod "${p.name}" is in ${p.status} state with ${p.restarts} restarts`,
          suggestion: `Describe the pod and check logs for errors`,
          autoFixable: false,
          timestamp: new Date().toISOString(),
          detected: true,
        })
      }

      setAnomalies(allAnomalies)

      // Get AI suggestions based on context
      const ctx = {
        system: stats || {},
        docker: { containers: containers.containers || containers || [] },
        k8s: { pods: k8s.pods || [], deployments: k8s.summary || [] },
      }
      const sugResult = await agentApi.suggestions("default", ctx).catch(() => ({ data: [] }))
      setSuggestions(sugResult.data || sugResult || [])

      if (allAnomalies.length === 0) {
        addLog("✅ No anomalies detected")
      } else {
        addLog(`⚠️ Found ${allAnomalies.length} issue(s)`)
      }
    } catch (err) {
      addLog(`❌ Scan error: ${(err as Error).message}`)
    } finally {
      setScanning(false)
    }
  }, [])

  useEffect(() => {
    scanForAnomalies()
    const interval = setInterval(() => {
      if (autoScan) scanForAnomalies()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoScan, scanForAnomalies])

  return (
    <AppShell>
      <div style={{ padding: "32px", minHeight: "100vh", background: colors.surfaceBase, color: colors.onSurface, fontFamily: "system-ui, sans-serif" }}>
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Brain size={28} color={colors.primary} />
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: colors.onSurface, letterSpacing: "-0.02em" }}>AI Autonomous Agent</h1>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: colors.onSurfaceVariant }}>Autonomous anomaly detection & infrastructure intelligence</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: colors.onSurfaceVariant, cursor: "pointer" }}>
                <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)}
                  style={{ accentColor: colors.primary }} />
                Auto-scan (30s)
              </label>
              <button
                onClick={scanForAnomalies}
                disabled={scanning}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px",
                  border: "1px solid rgba(34,211,238,0.2)", background: scanning ? "rgba(34,211,238,0.04)" : "rgba(34,211,238,0.1)",
                  color: colors.primary, fontSize: "14px", fontWeight: 600, cursor: scanning ? "not-allowed" : "pointer", opacity: scanning ? 0.6 : 1,
                }}
              >
                {scanning ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                {scanning ? "Scanning..." : "Scan Now"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Status Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { icon: <AlertTriangle size={22} />, label: "Critical", value: anomalies.filter(a => a.severity === "critical").length, color: colors.error, bg: "rgba(255,0,85,0.1)" },
            { icon: <Activity size={22} />, label: "Warnings", value: anomalies.filter(a => a.severity === "warning").length, color: "#facc15", bg: "rgba(250,204,21,0.1)" },
            { icon: <CheckCircle size={22} />, label: "Auto-fixable", value: anomalies.filter(a => a.autoFixable).length, color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
            { icon: <Lightbulb size={22} />, label: "Suggestions", value: suggestions.length, color: colors.secondary, bg: "rgba(221,183,255,0.1)" },
          ].map((card, i) => (
            <motion.div key={card.label} {...fadeUp} transition={{ duration: 0.4, delay: 0.05 * i }}>
              <HolographicCard className="p-5">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "12px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", color: colors.onSurfaceVariant, fontWeight: 500 }}>{card.label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: 700, color: colors.onSurface }}>{card.value}</p>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {/* Anomalies */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
            <HolographicCard className="p-6" glowColor="rgba(255,0,85,0.05)">
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Detected Anomalies</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                {anomalies.map((a) => (
                  <div key={a.id}
                    style={{
                      padding: "14px", borderRadius: "10px",
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${a.severity === "critical" ? "rgba(255,0,85,0.2)" : "rgba(250,204,21,0.2)"}`,
                      borderLeft: `3px solid ${a.severity === "critical" ? colors.error : "#facc15"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: a.severity === "critical" ? colors.error : "#facc15" }}>
                        {a.type}
                      </span>
                      <span style={{
                        padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                        background: a.severity === "critical" ? "rgba(255,0,85,0.15)" : "rgba(250,204,21,0.15)",
                        color: a.severity === "critical" ? colors.error : "#facc15",
                      }}>
                        {a.severity}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: colors.onSurface }}>{a.message}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: colors.onSurfaceVariant }}>💡 {a.suggestion}</p>
                  </div>
                ))}
                {anomalies.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: colors.onSurfaceVariant }}>
                    <CheckCircle size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                    <p style={{ fontSize: "14px" }}>All systems normal</p>
                    <p style={{ fontSize: "12px" }}>No anomalies detected in current scan</p>
                  </div>
                )}
              </div>
            </HolographicCard>
          </motion.div>

          {/* Suggestions */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
            <HolographicCard className="p-6" glowColor="rgba(221,183,255,0.05)">
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>AI Suggestions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {suggestions.map((s) => (
                  <div key={s.id}
                    onClick={() => router.push(`/chat?prompt=${encodeURIComponent(s.prompt || s.command)}`)}
                    style={{
                      padding: "14px", borderRadius: "10px",
                      background: "rgba(221,183,255,0.03)", border: "1px solid rgba(221,183,255,0.1)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(221,183,255,0.06)"; e.currentTarget.style.borderColor = "rgba(221,183,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(221,183,255,0.03)"; e.currentTarget.style.borderColor = "rgba(221,183,255,0.1)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <Zap size={14} color={colors.secondary} />
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: colors.secondary }}>{s.context}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: colors.onSurface }}>{s.command}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: colors.onSurfaceVariant }}>{s.description}</p>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <p style={{ color: colors.onSurfaceVariant, fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                    No suggestions available. Run a scan first.
                  </p>
                )}
              </div>
            </HolographicCard>
          </motion.div>
        </div>

        {/* Agent Activity Log */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <HolographicCard className="p-6">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Bot size={18} color={colors.primary} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Agent Activity Log</h2>
            </div>
            <div style={{
              maxHeight: "200px", overflowY: "auto",
              fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", lineHeight: 1.6,
            }}>
              {agentLog.map((line, i) => (
                <div key={i} style={{ color: line.includes("⚠️") ? "#facc15" : line.includes("❌") ? colors.error : line.includes("✅") ? "#4ade80" : colors.onSurfaceVariant }}>
                  {line}
                </div>
              ))}
              {agentLog.length === 0 && (
                <div style={{ color: colors.onSurfaceVariant }}>No activity yet...</div>
              )}
            </div>
          </HolographicCard>
        </motion.div>
      </div>
    </AppShell>
  )
}



