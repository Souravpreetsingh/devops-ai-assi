"use client"

import { useState, type FormEvent } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Particles from "@/components/Particles"
import AICore from "@/components/AICore"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(username, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #020617 0%, #020617 100%)" }}
    >
      <Particles count={40} color="34,211,238" speed={0.2} interactive />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 pointer-events-none flex items-center justify-center"
        style={{ zIndex: 0 }}
      >
        <AICore size={400} pulse />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <AICore size={80} pulse className="mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-primary font-display mb-1"
            style={{ textShadow: "0 0 20px rgba(34,211,238,0.2)" }}
          >
            Devi
          </h1>
          <p className="text-on-surface-variant text-sm">AI DevOps Operating System</p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-xl p-8 border"
          style={{
            background: "rgba(15,23,42,0.9)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(34,211,238,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="mb-5">
            <label className="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none"
              style={{
                background: "rgba(0,0,0,0.3)",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#e2e8f0",
              }}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none"
              style={{
                background: "rgba(0,0,0,0.3)",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#e2e8f0",
              }}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
              boxShadow: "0 0 20px rgba(34,211,238,0.3)",
            }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <p className="mt-4 text-center text-[11px] text-on-surface-variant font-mono">
            Default: admin / admin123
          </p>
        </form>
      </motion.div>
    </div>
  )
}


