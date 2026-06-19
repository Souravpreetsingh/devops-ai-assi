"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useMemo } from "react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import {
  Activity, Cpu, HardDrive, Database,
  Clock, Wifi, Terminal, Zap, Server, Gauge,
} from "lucide-react"
import AppShell from "@/components/AppShell"
import ActivityFeed from "@/components/ActivityFeed"
import AICore from "@/components/AICore"
import GlassCard from "@/components/GlassCard"
import PageTransition from "@/components/PageTransition"
import { systemApi } from "@/lib/api"
import { getSocket } from "@/lib/socket"

const glass = {
  background: "rgba(15,23,42,0.5)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.04)",
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

function LiveDot() {
  return (
    <motion.span
      style={{
        display: "inline-block", width: 6, height: 6, borderRadius: "50%",
        background: "#4ade80",
        boxShadow: "0 0 10px rgba(74,222,128,0.6)",
      }}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  )
}

function StatCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: string; icon: any; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, scale: 1.01 }}
      style={{ borderRadius: 12, padding: "14px 16px", ...glass, display: "flex", alignItems: "center", gap: 12, cursor: "default" }}
    >
      <div style={{ padding: 8, borderRadius: 10, background: `${color}12` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#dce1fb", lineHeight: 1.2 }}>{value}</div>
      </div>
    </motion.div>
  )
}

function MiniChart({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <div style={{ height: 48 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#fill-${color.replace("#", "")})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [cpuChart, setCpuChart] = useState<{ t: number; v: number }[]>([])
  const [memChart, setMemChart] = useState<{ t: number; v: number }[]>([])
  const [diskChart, setDiskChart] = useState<{ t: number; v: number }[]>([])

  const fetchStats = async () => {
    try {
      const data = await systemApi.stats()
      setStats(data)
      const v = Math.round(data.cpu.usage)
      setCpuChart((prev) => [...prev.slice(-29), { t: prev.length, v }])
      setMemChart((prev) => [...prev.slice(-29), { t: prev.length, v: Math.round(data.memory.percent) }])
      setDiskChart((prev) => [...prev.slice(-29), { t: prev.length, v: Math.round(data.disk.percent) }])
    } catch {}
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()
    socket.emit("subscribe:stats")
    socket.on("system:update", (data: any) => {
      setStats(data)
      setCpuChart((prev) => [...prev.slice(-29), { t: prev.length, v: Math.round(data.cpu.usage) }])
      setMemChart((prev) => [...prev.slice(-29), { t: prev.length, v: Math.round(data.memory.percent) }])
      setDiskChart((prev) => [...prev.slice(-29), { t: prev.length, v: Math.round(data.disk.percent) }])
    })
    return () => {
      socket.emit("unsubscribe:stats")
      socket.off("system:update")
    }
  }, [])

  const cpuAvg = useMemo(() => {
    if (cpuChart.length === 0) return 0
    return Math.round(cpuChart.reduce((a, b) => a + b.v, 0) / cpuChart.length)
  }, [cpuChart])

  return (
    <AppShell>
      <PageTransition>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: "100vh" }}>

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 12, padding: "12px 20px", ...glass }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AICore size={28} pulse={false} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#dce1fb", letterSpacing: "-0.01em" }}>Dashboard</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 20, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <LiveDot />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#4ade80" }}>LIVE</span>
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono',monospace" }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Host: {stats?.hostname || "—"}</span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Up: {stats ? formatUptime(stats.uptime) : "—"}</span>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <StatCard label="CPU" value={stats ? `${stats.cpu.usage}%` : "—"} icon={Cpu} color="#8aebff" delay={0.02} />
          <StatCard label="Memory" value={stats ? `${stats.memory.used.toFixed(1)}/${stats.memory.total.toFixed(0)} GB` : "—"} icon={HardDrive} color="#ddb7ff" delay={0.04} />
          <StatCard label="Disk" value={stats ? `${stats.disk.used.toFixed(0)}/${stats.disk.total.toFixed(0)} GB` : "—"} icon={Database} color="#d9e70d" delay={0.06} />
          <StatCard label="Processes" value={stats ? `${stats.processes}` : "—"} icon={Activity} color="#8aebff" delay={0.08} />
        </div>

        {/* Main charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { title: "CPU Usage", value: stats?.cpu?.usage, unit: "%", icon: Cpu, color: "#8aebff", chart: cpuChart, sub: `${stats?.cpu?.cores || "—"} cores · Load: ${stats?.cpu?.load?.[0]?.toFixed(1) || "—"}`, avg: cpuAvg },
            { title: "Memory", value: stats?.memory?.percent, unit: "%", icon: Gauge, color: "#ddb7ff", chart: memChart, sub: `${stats ? `${stats.memory.used.toFixed(1)} GB used` : "—"} · ${stats ? `${stats.memory.total.toFixed(0)} GB` : "—"} total` },
            { title: "Disk", value: stats?.disk?.percent, unit: "%", icon: Database, color: "#d9e70d", chart: diskChart, sub: `${stats ? `${stats.disk.used.toFixed(0)} GB used` : "—"} · ${stats ? `${stats.disk.total.toFixed(0)} GB` : "—"} total` },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              style={{ borderRadius: 12, padding: 20, ...glass }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{card.title}</span>
                <card.icon size={14} color={card.color} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: card.color, lineHeight: 1 }}>
                  {card.value ?? "—"}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{card.unit}</span>
              </div>
              <MiniChart data={card.chart || []} color={card.color} />
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                <span>{card.sub}</span>
                {card.avg !== undefined && <span>Avg: {card.avg}{card.unit}</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Activity + Network */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            whileHover={{ y: -1 }}
            style={{ borderRadius: 12, padding: 20, ...glass }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Activity Feed</span>
              <Clock size={14} color="rgba(255,255,255,0.3)" />
            </div>
            <ActivityFeed maxItems={8} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ y: -1 }}
            style={{ borderRadius: 12, padding: 20, ...glass }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Network</span>
              <Wifi size={14} color="#8aebff" />
            </div>
            {stats ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Download", value: `${stats.network.rxSpeed} MB/s` },
                  { label: "Upload", value: `${stats.network.txSpeed} MB/s` },
                  { label: "Total Sent", value: formatBytes(stats.network.txBytes) },
                  { label: "Connections", value: `${stats.network.connections}` },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: "#dce1fb", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Waiting for data...</div>
            )}
          </motion.div>
        </div>

        {/* Server Info + AI Command */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            whileHover={{ y: -1 }}
            style={{ borderRadius: 12, padding: 20, ...glass }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Server Info</span>
              <Server size={14} color="#8aebff" />
            </div>
            {stats ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {[
                  { label: "Hostname", value: stats.hostname },
                  { label: "OS", value: stats.os },
                  { label: "Kernel", value: stats.kernel },
                  { label: "CPU Cores", value: `${stats.cpu.cores}` },
                  { label: "Processes", value: `${stats.processes}` },
                  { label: "Uptime", value: formatUptime(stats.uptime) },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 1 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#dce1fb", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Waiting for data...</div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ y: -1 }}
            style={{ borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, ...glass }}
          >
            <Zap size={16} color="#8aebff" />
            <input placeholder="AI command — deploy, scale, status, logs..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#dce1fb", fontSize: 12 }}
            />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em", fontFamily: "'JetBrains Mono',monospace" }}>⏎ ENTER</span>
          </motion.div>
        </div>

      </div>
      </PageTransition>
    </AppShell>
  )
}
