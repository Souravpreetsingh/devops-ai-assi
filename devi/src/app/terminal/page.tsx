"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Terminal as TerminalIcon, Trash2, Plus, X, AlertCircle } from "lucide-react"
import AppShell from "@/components/AppShell"
import { getSocket } from "@/lib/socket"

interface Tab {
  id: string
  name: string
  lines: { type: "stdout" | "stderr" | "input"; text: string }[]
  input: string
  history: string[]
  historyIdx: number
}

const createTab = (name: string): Tab => ({
  id: Math.random().toString(36).slice(2, 10),
  name,
  lines: [
    { type: "stdout", text: `Devi Terminal — ${name}` },
    { type: "stdout", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
  ],
  input: "",
  history: [],
  historyIdx: -1,
})

const suggestions = [
  { cmd: "help", desc: "List available commands" },
  { cmd: "docker ps", desc: "List running containers" },
  { cmd: "docker stats", desc: "Container resource usage" },
  { cmd: "kubectl get pods", desc: "List pods" },
  { cmd: "ls -la", desc: "List files" },
  { cmd: "ps aux", desc: "Running processes" },
  { cmd: "df -h", desc: "Disk usage" },
  { cmd: "free -h", desc: "Memory usage" },
  { cmd: "clear", desc: "Clear terminal" },
]

export default function TerminalPage() {
  const [tabs, setTabs] = useState<Tab[]>([createTab("main")])
  const [activeTab, setActiveTab] = useState("main")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [currentTab?.lines])

  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()
    socket.on("terminal:output", (data: { type: string; data: string }) => {
      setTabs((prev) => prev.map((t) =>
        t.id === activeTab
          ? { ...t, lines: [...t.lines, { type: data.type as "stdout" | "stderr", text: data.data }] }
          : t
      ))
    })
    return () => { socket.off("terminal:output") }
  }, [activeTab])

  const execute = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return
    setTabs((prev) => prev.map((t) =>
      t.id === activeTab
        ? { ...t, lines: [...t.lines, { type: "input", text: `$ ${trimmed}` }], history: [...t.history, trimmed], historyIdx: -1, input: "" }
        : t
    ))

    if (trimmed === "clear") {
      setTabs((prev) => prev.map((t) => t.id === activeTab ? { ...t, lines: [] } : t))
      return
    }

    if (trimmed === "help") {
      setTabs((prev) => prev.map((t) => {
        if (t.id !== activeTab) return t
        const helpLines = suggestions.map((s) => ({ type: "stdout" as const, text: `  ${s.cmd.padEnd(22)} ${s.desc}` }))
        return { ...t, lines: [...t.lines, { type: "stdout", text: "Available commands:" }, ...helpLines] }
      }))
      return
    }

    try {
      const { terminalApi } = await import("@/lib/api")
      const result = await terminalApi.execute(trimmed)
      setTabs((prev) => prev.map((t) =>
        t.id === activeTab
          ? { ...t, lines: [...t.lines, { type: "stdout", text: result.output }] }
          : t
      ))
    } catch (err: any) {
      setTabs((prev) => prev.map((t) =>
        t.id === activeTab
          ? { ...t, lines: [...t.lines, { type: "stderr", text: `Error: ${err.message}` }] }
          : t
      ))
    }
  }, [activeTab])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { setShowSuggestions(false); execute(currentTab.input) }
    else if (e.key === "ArrowUp") {
      e.preventDefault()
      const newIdx = Math.min(currentTab.historyIdx + 1, currentTab.history.length - 1)
      setTabs((prev) => prev.map((t) =>
        t.id === activeTab ? { ...t, historyIdx: newIdx, input: currentTab.history[currentTab.history.length - 1 - newIdx] || "" } : t
      ))
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const newIdx = Math.max(currentTab.historyIdx - 1, -1)
      setTabs((prev) => prev.map((t) =>
        t.id === activeTab ? { ...t, historyIdx: newIdx, input: newIdx === -1 ? "" : t.history[t.history.length - 1 - newIdx] || "" } : t
      ))
    } else if (e.key === "Tab") {
      e.preventDefault()
      setShowSuggestions(!showSuggestions)
    }
  }

  const filteredSuggestions = suggestions.filter((s) =>
    s.cmd.toLowerCase().includes(currentTab.input.toLowerCase())
  )

  const addTab = () => {
    const name = `tab-${tabs.length + 1}`
    const tab = createTab(name)
    setTabs([...tabs, tab])
    setActiveTab(tab.id)
  }

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return
    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)
    if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1].id)
  }

  return (
    <AppShell>
      <div style={{ padding: 24, minHeight: "100vh", background: "#020617" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TerminalIcon size={20} color="#8aebff" />
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#dce1fb", letterSpacing: "-0.02em" }}>Terminal</h1>
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
              {currentTab.history.length} commands · Tab for suggestions · ↑↓ history
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8, alignItems: "center" }}>
            {tabs.map((t) => (
              <div key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                  borderRadius: "6px 6px 0 0", cursor: "pointer", fontSize: 10,
                  background: t.id === activeTab ? "rgba(138,235,255,0.06)" : "transparent",
                  border: `1px solid ${t.id === activeTab ? "rgba(138,235,255,0.1)" : "transparent"}`,
                  borderBottom: t.id === activeTab ? "1px solid rgba(138,235,255,0.15)" : "none",
                  color: t.id === activeTab ? "#8aebff" : "rgba(255,255,255,0.3)",
                }}>
                <TerminalIcon size={11} />
                <span>{t.name}</span>
                {tabs.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); closeTab(t.id) }}
                    style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addTab}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex" }}>
              <Plus size={12} />
            </button>
          </div>

          {/* Terminal window */}
          <div style={{
            borderRadius: 10, overflow: "hidden",
            background: "rgba(5, 10, 25, 0.95)",
            border: "1px solid rgba(138,235,255,0.06)",
            boxShadow: "0 0 30px rgba(34,211,238,0.02), inset 0 0 60px rgba(0,0,0,0.3)",
          }}>
            {/* Terminal content */}
            <div ref={scrollRef}
              style={{
                height: "calc(100vh - 280px)", minHeight: 300, overflow: "auto",
                padding: "14px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.6,
              }}>
              {currentTab.lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    color: line.type === "input" ? "#8aebff" : line.type === "stderr" ? "#ffb4ab" : "rgba(255,255,255,0.55)",
                    whiteSpace: "pre-wrap", wordBreak: "break-all",
                  }}
                >
                  {line.text}
                </motion.div>
              ))}
            </div>

            {/* Input bar */}
            <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.3)", position: "relative" }}>
              <span style={{ color: "#8aebff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginRight: 8 }}>$</span>
              <input
                ref={inputRef}
                value={currentTab.input}
                onChange={(e) => setTabs((prev) => prev.map((t) => t.id === activeTab ? { ...t, input: e.target.value } : t))}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(false)}
                placeholder="Type a command..."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#dce1fb", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
              />
              {/* Blinking cursor */}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ width: 6, height: 14, background: "#8aebff", marginLeft: -3, flexShrink: 0 }}
              />

              {/* Suggestions dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", bottom: "100%", left: 0, right: 0,
                  background: "rgba(5,10,25,0.98)", border: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "none", borderRadius: "8px 8px 0 0", overflow: "hidden",
                }}>
                  {filteredSuggestions.map((s) => (
                    <div key={s.cmd}
                      onClick={() => {
                        setTabs((prev) => prev.map((t) => t.id === activeTab ? { ...t, input: s.cmd } : t))
                        setShowSuggestions(false)
                        inputRef.current?.focus()
                      }}
                      style={{ padding: "5px 12px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(138,235,255,0.06)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <span style={{ color: "#8aebff" }}>{s.cmd}</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
