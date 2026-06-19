"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface GlassCardProps {
  children: ReactNode
  className?: string
  glow?: "cyan" | "purple" | "none"
  hover?: boolean
  onClick?: () => void
}

export default function GlassCard({ children, className = "", glow = "cyan", hover = true, onClick }: GlassCardProps) {
  const glowColor = glow === "cyan" ? "rgba(34,211,238,0.06)" : glow === "purple" ? "rgba(168,85,247,0.06)" : "transparent"
  const hoverGlow = glow === "cyan" ? "rgba(34,211,238,0.15)" : glow === "purple" ? "rgba(168,85,247,0.15)" : "transparent"

  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-xl border transition-colors duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.06)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: "translate3d(0,0,0)",
        willChange: "transform",
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = `0 12px 48px rgba(0,0,0,0.4), 0 0 30px ${hoverGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`
          e.currentTarget.style.borderColor = glow === "cyan" ? "rgba(34,211,238,0.15)" : glow === "purple" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)"
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"
        }
      }}
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)`,
          }}
        />
      </div>
      {children}
    </motion.div>
  )
}
