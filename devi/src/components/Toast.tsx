"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (type: ToastType, title: string, message?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", icon: "#4ade80" },
  error: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", icon: "#ef4444" },
  warning: { bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.25)", icon: "#facc15" },
  info: { bg: "rgba(138,235,255,0.1)", border: "rgba(138,235,255,0.25)", icon: "#00f2ff" },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6)
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type]
            const c = colors[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                style={{
                  pointerEvents: "auto",
                  minWidth: 300,
                  maxWidth: 420,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  backdropFilter: "blur(20px)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <Icon size={16} color={c.icon} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#dce1fb" }}>{toast.title}</div>
                  {toast.message && <div style={{ fontSize: 11, color: "#bbc9cd", marginTop: 2 }}>{toast.message}</div>}
                </div>
                <button onClick={() => removeToast(toast.id)}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 2, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

