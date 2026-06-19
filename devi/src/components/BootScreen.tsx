"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface BootScreenProps {
  onComplete: () => void
  duration?: number
}

const phases = [
  "Initializing Devi kernel...",
  "Mounting AI engine modules...",
  "Establishing infrastructure links...",
  "Calibrating neural network...",
  "Starting DevOps services...",
  "System online.",
]

export default function BootScreen({ onComplete, duration = 3000 }: BootScreenProps) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)
  const [text, setText] = useState("")
  const [show, setShow] = useState(true)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(elapsed / duration, 1)
      setProgress(pct)
      const phaseIdx = Math.min(Math.floor(pct * phases.length), phases.length - 1)
      setPhase(phaseIdx)
      setText(phases[phaseIdx])

      if (pct >= 1) {
        clearInterval(interval)
        setTimeout(() => {
          setShow(false)
          setTimeout(onComplete, 400)
        }, 400)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, #050a18 0%, #020617 100%)",
          }}
        >
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04), transparent 70%)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.03), transparent 70%)" }} />

          {/* Animated core */}
          <div className="relative mb-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-28 h-28 rounded-2xl flex items-center justify-center"
              style={{
                border: "1px solid rgba(34,211,238,0.15)",
                background: "rgba(34,211,238,0.03)",
                boxShadow: "0 0 60px rgba(34,211,238,0.08), inset 0 0 60px rgba(34,211,238,0.03)",
              }}
            >
              <motion.span
                className="text-5xl font-bold"
                style={{ color: "#8aebff", textShadow: "0 0 30px rgba(34,211,238,0.4)" }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                D
              </motion.span>
            </motion.div>
            {/* Orbiting ring */}
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{ border: "1px solid rgba(34,211,238,0.06)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-2 rounded-full"
              style={{ border: "1px solid rgba(168,85,247,0.04)" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              style={{ background: "#8aebff", boxShadow: "0 0 12px rgba(34,211,238,0.6)" }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          <motion.h1
            className="text-3xl font-bold mb-2 font-display"
            style={{ color: "#8aebff", textShadow: "0 0 20px rgba(34,211,238,0.2)" }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Devi
          </motion.h1>
          <p className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
            AI DEVOPS OPERATING SYSTEM
          </p>

          {/* Progress bar */}
          <div className="w-80 mb-4">
            <div className="h-px rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, #22d3ee, #8aebff, #6f00be)",
                  boxShadow: "0 0 15px rgba(34,211,238,0.3)",
                  width: `${progress * 100}%`,
                }}
              />
            </div>
          </div>

          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-mono tracking-wide"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {text}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="ml-0.5"
            >
              _
            </motion.span>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
