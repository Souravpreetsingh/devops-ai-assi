"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Rocket, RotateCcw, History, GitBranch, CheckCircle, XCircle, Clock,
  Play, BarChart3, Container, Cpu
} from "lucide-react"
import AppShell from "@/components/AppShell"
import HolographicCard from "@/components/HolographicCard"
import { useToast } from "@/components/Toast"
import { cicdApi } from "@/lib/api"

const colors = {
  surfaceBase: "#020617",
  primary: "#8aebff",
  secondary: "#ddb7ff",
  onSurface: "#dce1fb",
  onSurfaceVariant: "#bbc9cd",
  error: "#ffb4ab",
  tertiary: "#d9e70d",
}

const glass = {
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.05)",
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export default function CICDPage() {
  const [deployments, setDeployments] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [depData, histData] = await Promise.all([
        cicdApi.deployments().catch(() => []),
        cicdApi.history(30).catch(() => []),
      ])
      setDeployments(depData || [])
      setHistory(histData || [])
    } catch (err) {
      toast.addToast("error", "Failed to fetch CI/CD data", (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const doDeploy = async (service: string, type: string) => {
    try {
      const dep = await cicdApi.createDeployment({
        service,
        version: `2.${Math.floor(Math.random() * 10)}.0`,
        type,
        strategy: "rolling",
        replicas: 3,
        imageTag: `v${Date.now()}`,
      })
      toast.addToast("success", "Deployment started", `${service} is deploying...`)
      fetchData()
    } catch (err) {
      toast.addToast("error", "Deploy failed", (err as Error).message)
    }
  }

  const doRollback = async (id: string) => {
    try {
      await cicdApi.rollback(id)
      toast.addToast("warning", "Rollback triggered", `Rolling back deployment ${id}`)
      fetchData()
    } catch (err) {
      toast.addToast("error", "Rollback failed", (err as Error).message)
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "32px", minHeight: "100vh", background: colors.surfaceBase, color: colors.onSurface, fontFamily: "system-ui, sans-serif" }}>
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Rocket size={28} color={colors.primary} />
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: colors.onSurface, letterSpacing: "-0.02em" }}>CI/CD Pipeline</h1>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: colors.onSurfaceVariant }}>Automated deployments & rollback management</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
                color: colors.onSurface, fontSize: "14px", fontWeight: 500, cursor: "pointer",
              }}
            >
              <RotateCcw size={16} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Quick Deploy */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <HolographicCard className="p-6 mb-6">
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Quick Deploy</h2>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { service: "web-frontend", type: "frontend", icon: <Container size={18} /> },
                { service: "api-gateway", type: "backend", icon: <Cpu size={18} /> },
                { service: "auth-service", type: "backend", icon: <Cpu size={18} /> },
                { service: "payment-worker", type: "backend", icon: <BarChart3 size={18} /> },
              ].map((item) => (
                <button key={item.service}
                  onClick={() => doDeploy(item.service, item.type)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "10px",
                    border: "1px solid rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.06)",
                    color: colors.primary, fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Play size={16} />
                  Deploy {item.service}
                </button>
              ))}
            </div>
          </HolographicCard>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {/* Active Deployments */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
            <HolographicCard className="p-6">
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Active Deployments</h2>
              {deployments.length === 0 ? (
                <p style={{ color: colors.onSurfaceVariant, fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                  No active deployments. Click a deploy button above to start one.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {deployments.map((d) => (
                    <div key={d.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderRadius: "10px",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: colors.onSurface }}>{d.service}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: colors.onSurfaceVariant }}>
                          v{d.version} · {d.strategy} · {d.replicas} replicas
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                          background: d.status === "running" ? "rgba(74,222,128,0.12)" : d.status === "failed" ? "rgba(255,0,85,0.12)" : "rgba(250,204,21,0.12)",
                          color: d.status === "running" ? "#4ade80" : d.status === "failed" ? "#ffb4ab" : "#facc15",
                        }}>
                          {d.status === "running" ? <CheckCircle size={12} /> : d.status === "failed" ? <XCircle size={12} /> : <Clock size={12} />}
                          {d.status}
                        </span>
                        <button
                          onClick={() => doRollback(d.id)}
                          style={{
                            padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,0,85,0.2)",
                            background: "rgba(255,0,85,0.08)", color: colors.error, fontSize: "12px",
                            fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </HolographicCard>
          </motion.div>

          {/* Activity History */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
            <HolographicCard className="p-6">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <History size={18} color={colors.primary} />
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Activity History</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "400px", overflowY: "auto" }}>
                {history.map((h) => (
                  <div key={h.id}
                    style={{
                      padding: "10px 14px", borderRadius: "8px",
                      background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${h.status === "success" ? "#4ade80" : h.status === "failed" ? "#ffb4ab" : "#facc15"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: colors.onSurfaceVariant }}>
                        {h.type}
                      </span>
                      <span style={{ fontSize: "11px", color: colors.onSurfaceVariant }}>·</span>
                      <span style={{ fontSize: "11px", color: colors.onSurfaceVariant }}>{h.user}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: colors.onSurface }}>{h.description}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: colors.onSurfaceVariant }}>
                      {new Date(h.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
                {history.length === 0 && (
                  <p style={{ color: colors.onSurfaceVariant, fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                    No activity yet. Deployments will appear here.
                  </p>
                )}
              </div>
            </HolographicCard>
          </motion.div>
        </div>

        {/* Pipeline Visualization */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <HolographicCard className="p-6">
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Pipeline Visualization</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {["Build", "Test", "Docker Build", "Push Registry", "Deploy Staging", "Smoke Test", "Deploy Production"].map((step, i) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    padding: "10px 20px", borderRadius: "10px",
                    background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)",
                    color: colors.primary, fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
                  }}>
                    <span style={{ opacity: 0.6, marginRight: "8px" }}>{i + 1}.</span>
                    {step}
                  </div>
                  {i < 6 && <span style={{ color: colors.onSurfaceVariant, opacity: 0.3 }}>→</span>}
                </div>
              ))}
            </div>
          </HolographicCard>
        </motion.div>
      </div>
    </AppShell>
  )
}



