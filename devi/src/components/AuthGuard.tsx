"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #020617, #020617)" }}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl border border-primary/30 mx-auto mb-4 flex items-center justify-center"
            style={{ boxShadow: "0 0 30px rgba(34,211,238,0.1)" }}
          >
            <span className="text-3xl font-bold text-primary">D</span>
          </div>
          <p className="text-on-surface-variant text-sm font-mono">Loading Devi...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

