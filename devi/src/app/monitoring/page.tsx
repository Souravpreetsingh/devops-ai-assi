"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu, MemoryStick, HardDrive, Network,
  Activity, Hash, Monitor, Clock
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import AppShell from "@/components/AppShell";

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

const cpuHistory = [
  { time: "00:00", cpu: 23 }, { time: "01:00", cpu: 18 }, { time: "02:00", cpu: 12 }, { time: "03:00", cpu: 9 },
  { time: "04:00", cpu: 14 }, { time: "05:00", cpu: 22 }, { time: "06:00", cpu: 35 }, { time: "07:00", cpu: 47 },
  { time: "08:00", cpu: 62 }, { time: "09:00", cpu: 78 }, { time: "10:00", cpu: 84 }, { time: "11:00", cpu: 76 },
  { time: "12:00", cpu: 68 }, { time: "13:00", cpu: 71 }, { time: "14:00", cpu: 65 }, { time: "15:00", cpu: 58 },
  { time: "16:00", cpu: 52 }, { time: "17:00", cpu: 48 }, { time: "18:00", cpu: 55 }, { time: "19:00", cpu: 63 },
  { time: "20:00", cpu: 58 }, { time: "21:00", cpu: 44 }, { time: "22:00", cpu: 32 }, { time: "23:00", cpu: 25 },
];

const memoryHistory = [
  { time: "00:00", used: 4.2 }, { time: "01:00", used: 3.8 }, { time: "02:00", used: 3.5 }, { time: "03:00", used: 3.2 },
  { time: "04:00", used: 3.6 }, { time: "05:00", used: 4.0 }, { time: "06:00", used: 4.5 }, { time: "07:00", used: 5.1 },
  { time: "08:00", used: 5.8 }, { time: "09:00", used: 6.2 }, { time: "10:00", used: 6.0 }, { time: "11:00", used: 5.7 },
  { time: "12:00", used: 5.5 }, { time: "13:00", used: 5.9 }, { time: "14:00", used: 5.6 }, { time: "15:00", used: 5.2 },
  { time: "16:00", used: 4.9 }, { time: "17:00", used: 4.6 }, { time: "18:00", used: 5.0 }, { time: "19:00", used: 5.4 },
  { time: "20:00", used: 5.1 }, { time: "21:00", used: 4.7 }, { time: "22:00", used: 4.3 }, { time: "23:00", used: 4.0 },
];

const networkData = [
  { time: "00:00", rx: 0.8, tx: 0.4 }, { time: "02:00", rx: 0.6, tx: 0.3 }, { time: "04:00", rx: 0.9, tx: 0.5 },
  { time: "06:00", rx: 1.2, tx: 0.7 }, { time: "08:00", rx: 1.8, tx: 1.1 }, { time: "10:00", rx: 2.1, tx: 1.4 },
  { time: "12:00", rx: 1.9, tx: 1.2 }, { time: "14:00", rx: 1.6, tx: 1.0 }, { time: "16:00", rx: 1.4, tx: 0.8 },
  { time: "18:00", rx: 1.5, tx: 0.9 }, { time: "20:00", rx: 1.1, tx: 0.6 }, { time: "22:00", rx: 0.9, tx: 0.5 },
];

const processes = [
  { pid: 1284, name: "node", cpu: 12.4, memory: 8.7, status: "Running" },
  { pid: 2561, name: "nginx", cpu: 3.2, memory: 2.1, status: "Running" },
  { pid: 3892, name: "redis-server", cpu: 1.8, memory: 4.5, status: "Running" },
  { pid: 4103, name: "postgres", cpu: 5.6, memory: 12.3, status: "Running" },
  { pid: 5210, name: "python", cpu: 24.1, memory: 6.8, status: "Running" },
  { pid: 6378, name: "rabbitmq", cpu: 2.3, memory: 3.2, status: "Running" },
  { pid: 7845, name: "prometheus", cpu: 4.7, memory: 7.9, status: "Running" },
  { pid: 8912, name: "grafana", cpu: 1.5, memory: 5.4, status: "Running" },
  { pid: 9023, name: "logstash", cpu: 8.9, memory: 10.1, status: "Running" },
  { pid: 1567, name: "sleep-worker", cpu: 0.2, memory: 0.8, status: "Idle" },
];

const systemInfo = {
  hostname: "devi-prod-01",
  platform: "linux/amd64",
  uptime: "14d 6h 32m",
  kernel: "6.2.0-1014-gcp",
  os: "Ubuntu 22.04 LTS",
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function formatTime() {
  const d = new Date();
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function MonitoringPage() {
  const [mounted, setMounted] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    setMounted(true);
    setTimestamp(formatTime());
    const interval = setInterval(() => setTimestamp(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const chartDefaults = {
    stroke: colors.onSurfaceVariant,
    strokeWidth: 1,
    tick: { fill: colors.onSurfaceVariant, fontSize: 11 },
  };

  return (
    <AppShell>
      <div style={{ padding: "32px", minHeight: "100vh", background: colors.surfaceBase, color: colors.onSurface, fontFamily: "system-ui, sans-serif" }}>
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Activity size={28} color={colors.primary} />
              <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: colors.onSurface, letterSpacing: "-0.02em" }}>System Monitoring</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "8px 16px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Clock size={14} color={colors.primary} />
              <span style={{ fontSize: "13px", color: colors.onSurfaceVariant, fontFamily: "'JetBrains Mono', monospace" }}>{timestamp}</span>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { icon: <Cpu size={22} />, label: "CPU", value: "47%", sub: "8 cores" },
            { icon: <MemoryStick size={22} />, label: "Memory", value: "6.2/16 GB", sub: "38.8%" },
            { icon: <HardDrive size={22} />, label: "Disk", value: "398/512 GB", sub: "77.7%" },
            { icon: <Network size={22} />, label: "Network", value: "1.2 GB/s", sub: "1.4 GB/s peak" },
          ].map((card, i) => (
            <motion.div key={card.label} {...fadeUp} transition={{ duration: 0.4, delay: 0.05 * i }}>
              <div style={{ ...glass, borderRadius: "16px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(138, 235, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
                  {card.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: colors.onSurfaceVariant, fontWeight: 500 }}>{card.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: 700, color: colors.onSurface, letterSpacing: "-0.02em" }}>{card.value}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: colors.onSurfaceVariant }}>{card.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
            <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Cpu size={16} color={colors.primary} />
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: colors.onSurface }}>CPU Usage History</h2>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={cpuHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" {...chartDefaults} />
                  <YAxis domain={[0, 100]} unit="%" {...chartDefaults} />
                  <Tooltip
                    contentStyle={{ background: "rgba(2,6,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: colors.onSurface }}
                    labelStyle={{ color: colors.onSurfaceVariant }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke={colors.primary} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: colors.primary }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
            <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <MemoryStick size={16} color={colors.secondary} />
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Memory Usage</h2>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={memoryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" {...chartDefaults} />
                  <YAxis domain={[0, 8]} unit=" GB" {...chartDefaults} />
                  <Tooltip
                    contentStyle={{ background: "rgba(2,6,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: colors.onSurface }}
                    labelStyle={{ color: colors.onSurfaceVariant }}
                  />
                  <Area type="monotone" dataKey="used" stroke={colors.secondary} strokeWidth={2} fill={colors.secondary} fillOpacity={0.15} activeDot={{ r: 4, fill: colors.secondary }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }} style={{ marginBottom: "32px" }}>
          <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Network size={16} color={colors.tertiary} />
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Network I/O</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={networkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" {...chartDefaults} />
                <YAxis unit=" GB/s" {...chartDefaults} />
                <Tooltip
                  contentStyle={{ background: "rgba(2,6,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: colors.onSurface }}
                  labelStyle={{ color: colors.onSurfaceVariant }}
                />
                <Bar dataKey="rx" fill={colors.primary} radius={[4, 4, 0, 0]} name="RX" />
                <Bar dataKey="tx" fill={colors.secondary} radius={[4, 4, 0, 0]} name="TX" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }} style={{ marginBottom: "32px" }}>
          <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Hash size={16} color={colors.primary} />
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: colors.onSurface }}>Processes</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ color: colors.onSurfaceVariant, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["PID", "Name", "CPU%", "Memory%", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processes.map(p => (
                    <tr key={p.pid} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: colors.onSurfaceVariant }}>{p.pid}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: colors.onSurface }}>{p.name}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: p.cpu > 10 ? colors.primary : colors.onSurfaceVariant, fontWeight: 600 }}>{p.cpu.toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: p.memory > 8 ? colors.error : colors.onSurfaceVariant, fontWeight: 600 }}>{p.memory.toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                          background: p.status === "Running" ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                          color: p.status === "Running" ? "#4ade80" : colors.onSurfaceVariant,
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.4 }}>
          <div style={{ ...glass, borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Monitor size={16} color={colors.secondary} />
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: colors.onSurface }}>System Info</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
              {Object.entries(systemInfo).map(([key, val]) => (
                <div key={key} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: colors.onSurfaceVariant, fontWeight: 600 }}>{key}</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: colors.onSurface }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}




