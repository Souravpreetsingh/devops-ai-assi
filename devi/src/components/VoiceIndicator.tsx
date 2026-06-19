"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Volume2 } from "lucide-react"

interface VoiceIndicatorProps {
  state: "idle" | "listening" | "processing" | "speaking"
  interimText?: string
  onToggle: () => void
}

export default function VoiceIndicator({ state, interimText, onToggle }: VoiceIndicatorProps) {
  const isActive = state === "listening" || state === "speaking" || state === "processing"

  return (
    <div style={{ position: "relative" }}>
      {/* Rings */}
      <AnimatePresence>
        {state === "listening" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  border: "2px solid rgba(138, 235, 255, 0.3)",
                  pointerEvents: "none",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.92 }}
        animate={
          state === "listening"
            ? { scale: [1, 1.08, 1], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } }
            : state === "speaking"
              ? { scale: [1, 1.05, 1], transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" } }
              : { scale: 1 }
        }
        style={{
          position: "relative",
          padding: 6,
          background: state === "listening"
            ? "rgba(239, 68, 68, 0.15)"
            : state === "speaking"
              ? "rgba(138, 235, 255, 0.12)"
              : "transparent",
          border: state === "listening"
            ? "1px solid rgba(239, 68, 68, 0.3)"
            : "1px solid transparent",
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        title={state === "idle" ? "Start voice input" : "Stop voice input"}
      >
        {state === "speaking" ? (
          <Volume2 size={16} color="#8aebff" />
        ) : state === "listening" ? (
          <Mic size={16} color="#ef4444" />
        ) : (
          <Mic size={16} color={state === "idle" ? "rgba(255,255,255,0.25)" : "#8aebff"} />
        )}
      </motion.button>

      {/* Waveform bars (listening) */}
      <AnimatePresence>
        {state === "listening" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 2,
              height: 16,
              padding: "0 6px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: 4,
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            {[0, 1, 2, 3, 2, 1, 0].map((h, i) => (
              <motion.span
                key={i}
                animate={{
                  height: [4, 12, 16, 8, 14, 6, 10][i],
                  opacity: [0.7, 1, 0.8, 0.6, 1, 0.5, 0.9][i],
                }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                style={{
                  width: 2,
                  borderRadius: 1,
                  background: "#ef4444",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim text tooltip */}
      <AnimatePresence>
        {state === "listening" && interimText && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: 11,
              whiteSpace: "nowrap",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <span style={{ opacity: 0.7, marginRight: 4 }}>🎤</span>
            {interimText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{ marginLeft: 1 }}
            >
              |
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
