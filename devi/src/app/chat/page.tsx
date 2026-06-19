"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send, Copy, Check, Terminal, Plus, MessageSquare, Trash2, Zap, AlertCircle, Sparkles,
} from "lucide-react"
import AppShell from "@/components/AppShell"
import VoiceIndicator from "@/components/VoiceIndicator"
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

type Conversation = { id: string; title: string; createdAt: number }
type CodeBlock = { language: string; filename: string; code: string }
type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  codeBlocks?: CodeBlock[]
}

const glass = {
  background: "rgba(15,23,42,0.5)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.06)",
}

function rand(min: number, max: number) { return Math.round(Math.random() * (max - min) + min) }

function typewriter(text: string, onChunk: (full: string) => void, done: () => void) {
  let idx = 0
  const interval = setInterval(() => {
    idx++
    onChunk(text.slice(0, idx))
    if (idx >= text.length) {
      clearInterval(interval)
      done()
    }
  }, rand(10, 30))
  return () => clearInterval(interval)
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-[3px]" style={{ padding: "0 4px" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-[5px] h-[5px] rounded-full"
          style={{ background: "#8aebff" }}
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "c1", title: "K8s Cluster Analysis", createdAt: Date.now() - 3600000 },
    { id: "c2", title: "Redis Performance Review", createdAt: Date.now() - 7200000 },
    { id: "c3", title: "Deployment Rollback", createdAt: Date.now() - 86400000 },
  ])
  const [activeConv, setActiveConv] = useState("c1")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [typingText, setTypingText] = useState("")
  const [typingDone, setTypingDone] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, typingText])

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text)
    setTimeout(() => {
      const btn = document.querySelector("[data-send-btn]") as HTMLButtonElement
      if (btn) btn.click()
    }, 300)
  }, [])

  const voice = useVoiceAssistant({
    wakeWordMode: "off",
    autoSubmit: true,
    onTranscript: handleVoiceTranscript,
  })

  useEffect(() => {
    if (voice.isSupported) {
      const timer = setTimeout(() => voice.startListening(), 1000)
      return () => clearTimeout(timer)
    }
  }, [voice.isSupported])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const prompt = params.get("prompt")
    if (prompt) {
      setInput(prompt)
      setTimeout(() => {
        const btn = document.querySelector("[data-send-btn]") as HTMLButtonElement
        if (btn) btn.click()
      }, 500)
    }
  }, [])

  const sendToApi = async (text: string) => {
    setLoading(true)
    setError(null)
    setTypingText("")
    setTypingDone(false)

    const msgId = Date.now().toString()
    const newMsg: Message = { id: msgId, role: "assistant", content: "" }
    setMessages((prev) => [...prev, newMsg])

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const json = await res.json()
      const reply = json.data.reply
      const fullContent = reply.code
        ? `${reply.content}\n\n\`\`\`${reply.language || "bash"}\n${reply.code}\n\`\`\``
        : reply.content
      const codeBlocks: CodeBlock[] = reply.code
        ? [{ language: reply.language || "bash", filename: "devi response", code: reply.code }]
        : []

      cleanupRef.current = typewriter(
        fullContent,
        (chunk) => setTypingText(chunk),
        () => {
          setTypingDone(true)
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullContent, codeBlocks } : m))
          setLoading(false)
          voice.speak(reply.content.replace(/[#*`$\[\]]/g, "")).then(() => {
            if (voice.isSupported) voice.startListening()
          })
        },
      )
    } catch (err) {
      setError((err as Error).message)
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: `Error: ${(err as Error).message}` } : m))
      setLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    sendToApi(input.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <AppShell>
      <div style={{ display: "flex", height: "100vh", background: "#020617", overflow: "hidden" }}>
        {/* Conversations sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ ...glass, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}
            >
              <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => { setMessages([]); setTypingText(""); setLoading(false) }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", borderRadius: 8, border: "1px solid rgba(138,235,255,0.15)", color: "#8aebff", fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(138,235,255,0.06)" }}>
                  <Plus size={13} /> New Chat
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                {conversations.map((c) => (
                  <motion.div key={c.id} layout
                    onClick={() => setActiveConv(c.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                      borderRadius: 8, cursor: "pointer", fontSize: 11,
                      background: c.id === activeConv ? "rgba(138,235,255,0.06)" : "transparent",
                      border: c.id === activeConv ? "1px solid rgba(138,235,255,0.1)" : "1px solid transparent",
                      color: c.id === activeConv ? "#8aebff" : "rgba(255,255,255,0.4)",
                      transition: "all 0.15s",
                    }}
                    whileHover={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.4 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                    <Trash2 size={11} style={{ opacity: 0.2, cursor: "pointer", flexShrink: 0 }} />
                  </motion.div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", ...glass }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setShowSidebar(!showSidebar)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 2 }}>
                <MessageSquare size={15} />
              </button>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #8aebff, #6f00be)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(138,235,255,0.2)" }}>
                <Sparkles size={12} color="white" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#dce1fb" }}>Devi AI</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "1px 8px", borderRadius: 20, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
                <motion.span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <span style={{ fontSize: 8, color: "#4ade80", fontWeight: 700, letterSpacing: "0.08em" }}>ONLINE</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace" }}>dev-v1.2.1</span>
          </header>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
            {messages.length === 0 && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <motion.div
                  style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(138,235,255,0.12), rgba(111,0,190,0.12))", display: "flex", alignItems: "center", justifyContent: "center" }}
                  animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles size={24} color="#8aebff" />
                </motion.div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#dce1fb", marginBottom: 4 }}>Ask Devi anything</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Try: &ldquo;check cluster status&rdquo;, &ldquo;show logs&rdquo;, &ldquo;deploy update&rdquo;
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 360 }}>
                  {["Check cluster health", "Show pod logs", "Analyze performance", "Run diagnostics"].map((s) => (
                    <motion.button key={s} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setInput(s)}
                      style={{ padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", fontSize: 10, cursor: "pointer" }}>
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.map((msg, idx) => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    background: msg.role === "assistant" ? "linear-gradient(135deg, #8aebff, #6f00be)" : "linear-gradient(135deg, #ddb7ff, #490080)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: msg.role === "assistant" ? "0 0 12px rgba(138,235,255,0.15)" : "none",
                  }}>
                    {msg.role === "assistant" ? <Zap size={11} color="white" /> : <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>U</span>}
                  </div>

                  <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{
                      padding: msg.role === "user" ? "8px 14px" : "12px 16px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.role === "user" ? "rgba(15,23,42,0.7)" : "rgba(10,18,40,0.5)",
                      border: msg.role === "user"
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(138,235,255,0.08)",
                      boxShadow: msg.role === "assistant" ? "0 0 20px rgba(138,235,255,0.03)" : "none",
                    }}>
                      {msg.role === "user" ? (
                        <span style={{ fontSize: 13, color: "#dce1fb", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</span>
                      ) : (
                        <span style={{ fontSize: 13, color: "#dce1fb", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {idx === messages.length - 1 && !typingDone ? typingText : msg.content}
                          {idx === messages.length - 1 && !typingDone && <ThinkingDots />}
                        </span>
                      )}
                    </div>

                    {msg.codeBlocks?.map((block, ci) => (
                      <div key={ci} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", background: "rgba(7,13,31,0.9)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Terminal size={11} color="#8aebff" />
                            <span style={{ fontSize: 9, color: "#8aebff", fontFamily: "'JetBrains Mono',monospace" }}>{block.filename}</span>
                          </div>
                          <button onClick={() => copyCode(block.code, ci)}
                            style={{ display: "flex", alignItems: "center", gap: 3, background: "transparent", border: "none", color: copiedIdx === ci ? "#4ade80" : "rgba(255,255,255,0.25)", fontSize: 9, cursor: "pointer" }}>
                            {copiedIdx === ci ? <Check size={10} /> : <Copy size={10} />}
                            <span style={{ fontSize: 9 }}>{copiedIdx === ci ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <pre style={{ margin: 0, padding: "8px 12px", background: "rgba(7,13,31,0.5)", overflow: "auto", fontSize: 10, lineHeight: 1.5, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono',monospace" }}>
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #8aebff, #6f00be)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(138,235,255,0.1)" }}>
                    <Zap size={11} color="white" />
                  </div>
                  <div style={{ padding: "8px 14px", borderRadius: "14px 14px 14px 4px", border: "1px solid rgba(138,235,255,0.08)", background: "rgba(10,18,40,0.4)" }}>
                    <span style={{ color: "#8aebff", fontSize: 11 }}>Thinking<ThinkingDots /></span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input area */}
          <div style={{ padding: "10px 24px 16px", ...glass, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, padding: "5px 10px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 10, color: "#fca5a5" }}>
                <AlertCircle size={11} />
                {error}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(12,19,36,0.8)", borderRadius: 10, padding: "3px 5px 3px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Devi or enter a command..."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#dce1fb", fontSize: 12, padding: "7px 0" }}
              />
              <VoiceIndicator state={voice.state} interimText={voice.interimText} onToggle={voice.toggleListening} />
              <button data-send-btn onClick={handleSend} disabled={!input.trim() || loading}
                style={{ padding: "7px 10px", background: "linear-gradient(135deg, #8aebff, #6f00be)", border: "none", borderRadius: 7, color: "white", cursor: loading || !input.trim() ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.4 : 1, transition: "opacity 0.15s" }}>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
