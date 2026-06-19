"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes, Container, Layers, Cpu,
  Activity, RefreshCw, Terminal, HardDrive,
  CheckCircle, XCircle, Clock, AlertTriangle
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";
import { kubernetesApi } from "@/lib/api";

const colors = {
  surfaceBase: "#020617",
  primary: "#8aebff",
  secondary: "#ddb7ff",
  onSurface: "#dce1fb",
  onSurfaceVariant: "#bbc9cd",
  error: "#ffb4ab",
  tertiary: "#d9e70d",
};

const glass = {
  background: "rgba(5, 5, 5, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const pods = [
  { name: "api-gateway-7f8b9c1d2e-4k6j", namespace: "default", status: "Running", ready: "1/1", restarts: 2, age: "12d" },
  { name: "auth-service-6a7b8c9d0e-3f5h", namespace: "default", status: "Running", ready: "1/1", restarts: 0, age: "12d" },
  { name: "user-service-5c6d7e8f9g-2h4j", namespace: "default", status: "Running", ready: "1/1", restarts: 1, age: "10d" },
  { name: "order-service-9a8b7c6d5e-1k3l", namespace: "default", status: "Running", ready: "1/1", restarts: 3, age: "10d" },
  { name: "payment-worker-4d5e6f7g8h-9i0j", namespace: "workers", status: "Running", ready: "1/1", restarts: 0, age: "8d" },
  { name: "notification-queue-3a4b5c6d7e-8f9g", namespace: "workers", status: "Failed", ready: "0/1", restarts: 5, age: "6d" },
  { name: "cache-redis-2e3f4g5h6i-7j8k", namespace: "cache", status: "Running", ready: "1/1", restarts: 0, age: "14d" },
  { name: "db-migration-job-1a2b3c4d5e-6f7g", namespace: "jobs", status: "Pending", ready: "0/1", restarts: 0, age: "1h" },
  { name: "frontend-app-8h9i0j1k2l-3m4n", namespace: "frontend", status: "Running", ready: "1/1", restarts: 0, age: "12d" },
  { name: "log-aggregator-5p6o7i8u9y-0t1r", namespace: "observability", status: "Running", ready: "1/1", restarts: 0, age: "12d" },
  { name: "prometheus-server-2e3r4t5y6u-7i8o", namespace: "observability", status: "Running", ready: "1/1", restarts: 0, age: "12d" },
  { name: "ingress-controller-9p0o1i2u3y-4t5r", namespace: "ingress", status: "Running", ready: "1/1", restarts: 1, age: "12d" },
];

const deployments = [
  { name: "api-gateway", replicas: 3, available: 3, image: "nginx:1.25-alpine", status: "Healthy" },
  { name: "auth-service", replicas: 3, available: 3, image: "node:20-slim", status: "Healthy" },
  { name: "user-service", replicas: 3, available: 3, image: "node:20-slim", status: "Healthy" },
  { name: "order-service", replicas: 3, available: 3, image: "node:20-slim", status: "Healthy" },
  { name: "payment-worker", replicas: 2, available: 2, image: "python:3.12-slim", status: "Healthy" },
  { name: "notification-queue", replicas: 2, available: 1, image: "rabbitmq:3.13", status: "Degraded" },
  { name: "cache-redis", replicas: 1, available: 1, image: "redis:7.2-alpine", status: "Healthy" },
  { name: "frontend-app", replicas: 3, available: 3, image: "node:20-slim", status: "Healthy" },
  { name: "prometheus-server", replicas: 1, available: 1, image: "prom/prometheus:v2.51", status: "Healthy" },
  { name: "ingress-controller", replicas: 2, available: 2, image: "nginx-ingress:1.10", status: "Healthy" },
  { name: "log-aggregator", replicas: 1, available: 0, image: "fluentd:v1.17", status: "Degraded" },
  { name: "db-migration-job", replicas: 1, available: 0, image: "node:20-slim", status: "Scaling" },
];

const clusterHealth = [
  { node: "node-1", cpu: 45, memory: 62 },
  { node: "node-2", cpu: 72, memory: 48 },
  { node: "node-3", cpu: 38, memory: 55 },
  { node: "node-4", cpu: 91, memory: 78 },
  { node: "node-5", cpu: 24, memory: 33 },
];

function getStatusColor(status: string) {
  switch (status) {
    case "Running": return "#4ade80";
    case "Healthy": return "#4ade80";
    case "Failed": return "#ffb4ab";
    case "Degraded": return "#ffb4ab";
    case "Pending": return "#facc15";
    case "Scaling": return "#facc15";
    default: return colors.onSurfaceVariant;
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "Running": return "rgba(74, 222, 128, 0.12)";
    case "Healthy": return "rgba(74, 222, 128, 0.12)";
    case "Failed": return "rgba(255, 0, 85, 0.12)";
    case "Degraded": return "rgba(255, 0, 85, 0.12)";
    case "Pending": return "rgba(250, 204, 21, 0.12)";
    case "Scaling": return "rgba(250, 204, 21, 0.12)";
    default: return "transparent";
  }
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function KubernetesPage() {
  const [mounted, setMounted] = useState(false)
  const [pods, setPods] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [nodes, setNodes] = useState<any[]>([])
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [podsData, depData, nodesData, healthData] = await Promise.all([
        kubernetesApi.pods().catch(() => ({ pods: [] })),
        kubernetesApi.deployments().catch(() => ({ deployments: [] })),
        kubernetesApi.nodes().catch(() => ({ nodes: [] })),
        kubernetesApi.health().catch(() => null),
      ])
      setPods(podsData.pods || [])
      setDeployments(depData.deployments || [])
      setNodes(nodesData.nodes || [])
      setHealth(healthData)
    } catch (err) {
      toast.addToast("error", "Failed to fetch K8s data", (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setMounted(true); fetchData() }, [])

  const doRestart = async (name: string, ns: string) => {
    try {
      await kubernetesApi.restartDeployment(name, ns)
      toast.addToast("success", "Deployment restarted", `${name} is restarting`)
      fetchData()
    } catch (err) {
      toast.addToast("error", "Restart failed", (err as Error).message)
    }
  }

  if (!mounted) return null;

  return (
    <AppShell>
      <div style={{ padding: "32px", minHeight: "100vh", background: colors.surfaceBase, color: colors.onSurface, fontFamily: "system-ui, sans-serif" }}>
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Container size={28} color={colors.primary} />
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: colors.onSurface, letterSpacing: "-0.02em" }}>Kubernetes Cluster</h1>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: colors.onSurfaceVariant }}>production-us-east-1</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(74, 222, 128, 0.1)", padding: "8px 16px", borderRadius: "999px", border: "1px solid rgba(74, 222, 128, 0.2)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px rgba(74,222,128,0.6)" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#4ade80" }}>Healthy</span>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { icon: <Boxes size={22} />, label: "Namespaces", value: health?.namespaces?.length?.toString() || "—" },
            { icon: <Layers size={22} />, label: "Pods", value: health ? `${health.pods.running}/${health.pods.total}` : `${pods.length}` },
            { icon: <Activity size={22} />, label: "Deployments", value: deployments.length.toString() },
            { icon: <Cpu size={22} />, label: "Nodes", value: nodes.length.toString() },
          ].map((card, i) => (
            <motion.div key={card.label} {...fadeUp} transition={{ duration: 0.4, delay: 0.05 * i }}>
              <div style={{ ...glass, borderRadius: "16px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(138, 235, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
                  {card.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: colors.onSurfaceVariant, fontWeight: 500 }}>{card.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: 700, color: colors.onSurface, letterSpacing: "-0.02em" }}>{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
            <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Pods</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ color: colors.onSurfaceVariant, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Name", "Namespace", "Status", "Ready", "Restarts", "Age"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pods.map(p => (
                      <tr key={p.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "12px", color: colors.primary }}>{p.name}</td>
                        <td style={{ padding: "10px 12px", color: colors.onSurfaceVariant }}>{p.namespace}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: getStatusBg(p.status), color: getStatusColor(p.status) }}>
                            {p.status === "Running" ? <CheckCircle size={12} /> : p.status === "Failed" ? <XCircle size={12} /> : p.status === "Pending" ? <Clock size={12} /> : <AlertTriangle size={12} />}
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: colors.onSurface }}>{p.ready}</td>
                        <td style={{ padding: "10px 12px", color: colors.onSurface }}>{p.restarts}</td>
                        <td style={{ padding: "10px 12px", color: colors.onSurfaceVariant }}>{p.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
            <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Deployments</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ color: colors.onSurfaceVariant, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Name", "Replicas", "Available", "Image", "Status"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map(d => (
                      <tr key={d.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "12px", color: colors.secondary }}>{d.name}</td>
                        <td style={{ padding: "10px 12px", color: colors.onSurface }}>{d.replicas}</td>
                        <td style={{ padding: "10px 12px", color: colors.onSurface }}>{d.available}</td>
                        <td style={{ padding: "10px 12px", color: colors.onSurfaceVariant, fontSize: "12px" }}>{d.image}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: getStatusBg(d.status), color: getStatusColor(d.status) }}>
                            {d.status === "Healthy" ? <CheckCircle size={12} /> : d.status === "Degraded" ? <XCircle size={12} /> : <Clock size={12} />}
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }} style={{ marginBottom: "32px" }}>
          <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 16px", color: colors.onSurface }}>Quick Actions</h2>
            <div style={{ display: "flex", gap: "12px" }}>
              {[
                { icon: <RefreshCw size={16} />, label: "Scale Up", color: colors.primary },
                { icon: <RefreshCw size={16} />, label: "Rolling Restart", color: colors.secondary },
                { icon: <Terminal size={16} />, label: "View Logs", color: colors.tertiary },
              ].map(a => (
                <button key={a.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
                    color: a.color, fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
          <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <HardDrive size={18} color={colors.primary} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Cluster Health</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
              {clusterHealth.map(n => (
                <div key={n.node} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: colors.onSurface }}>{n.node}</p>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: colors.onSurfaceVariant }}>CPU</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: n.cpu > 80 ? colors.error : colors.primary }}>{n.cpu}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${n.cpu}%`, background: n.cpu > 80 ? colors.error : colors.primary, borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: colors.onSurfaceVariant }}>Memory</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: n.memory > 70 ? colors.error : colors.secondary }}>{n.memory}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${n.memory}%`, background: n.memory > 70 ? colors.error : colors.secondary, borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}




