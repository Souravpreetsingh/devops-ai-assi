"use client"

import { type ReactNode, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HolographicCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  borderColor?: string
  onClick?: () => void
}

export default function HolographicCard({
  children,
  className,
  glowColor = "rgba(34,211,238,0.08)",
  borderColor = "rgba(255,255,255,0.08)",
  onClick,
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [mouseInside, setMouseInside] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setRotateX((y - 0.5) * -6)
    setRotateY((x - 0.5) * 6)
  }

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setMouseInside(true)}
      onMouseLeave={() => { setMouseInside(false); setRotateX(0); setRotateY(0) }}
      className={cn(
        "relative rounded-xl border transition-all duration-300",
        onClick && "cursor-pointer",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))",
        borderColor,
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transform: mouseInside ? `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : "perspective(600px) rotateX(0deg) rotateY(0deg)",
        transition: mouseInside ? "transform 0.1s ease" : "transform 0.3s ease",
      }}
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor.replace("0.08", "0.3")}, transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${glowColor.replace("0.08", "0.04")}, transparent 70%)`,
          }}
        />
      </div>
      {children}
    </motion.div>
  )
}
