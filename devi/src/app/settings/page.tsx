"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mic,
  Cpu,
  Bell,
  Palette,
  AlertTriangle,
  Save,
  Check,
  ChevronDown,
} from "lucide-react"
import AppShell from "@/components/AppShell"

const glassStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 16,
  padding: 24,
}

const labelStyle: React.CSSProperties = {
  color: "#dce1fb",
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
  display: "block",
}

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#dce1fb",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
}

const toggleTrack = (active: boolean): React.CSSProperties => ({
  width: 44,
  height: 24,
  borderRadius: 12,
  background: active ? "#8aebff" : "rgba(255,255,255,0.12)",
  position: "relative",
  cursor: "pointer",
  transition: "background 0.2s",
  flexShrink: 0,
})

const toggleThumb: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: "#fff",
  position: "absolute",
  top: 3,
  transition: "left 0.2s",
}

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: "rgba(138, 235, 255, 0.12)",
  color: "#8aebff",
}

const sectionTitle: React.CSSProperties = {
  color: "#dce1fb",
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 20,
  display: "flex",
  alignItems: "center",
  gap: 10,
}

const fieldRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 0",
}

const fieldLabel: React.CSSProperties = {
  color: "#bbc9cd",
  fontSize: 14,
}

const container: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 24px 80px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
}

const selectStyle: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23bbc9cd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  cursor: "pointer",
}

const dangerBtn: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid rgba(255, 180, 171, 0.3)",
  background: "rgba(255, 180, 171, 0.08)",
  color: "#ffb4ab",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  transition: "background 0.2s",
}

const primaryBtn: React.CSSProperties = {
  padding: "14px 32px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #8aebff, #ddb7ff)",
  color: "#050505",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "opacity 0.2s",
}

export default function SettingsPage() {
  const [name, setName] = useState("Devi Admin")
  const [email, setEmail] = useState("admin@devi.dev")
  const [wakeWord, setWakeWord] = useState(true)
  const [sensitivity, setSensitivity] = useState(65)
  const [voiceResponse, setVoiceResponse] = useState(true)
  const [aiProvider, setAiProvider] = useState("GPT-4")
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [desktopNotif, setDesktopNotif] = useState(false)
  const [soundFx, setSoundFx] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(() => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const handleReset = useCallback(() => {
    if (confirm("Reset all settings to defaults?")) {
      setName("Devi Admin")
      setEmail("admin@devi.dev")
      setWakeWord(true)
      setSensitivity(65)
      setVoiceResponse(true)
      setAiProvider("GPT-4")
      setEmailAlerts(true)
      setDesktopNotif(false)
      setSoundFx(true)
    }
  }, [])

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
    }
  }, [])

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <AppShell>
      <div style={container}>
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <h1 style={{ color: "#dce1fb", fontSize: 28, fontWeight: 700, margin: 0 }}>
            Settings
          </h1>
          <p style={{ color: "#bbc9cd", fontSize: 14, margin: "4px 0 0 0" }}>
            Configure your Devi experience
          </p>
        </motion.div>

        {/* Profile */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={glassStyle}
        >
          <div style={sectionTitle}>
            <User size={18} color="#8aebff" />
            Profile
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputBase}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputBase}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <div>
                <span style={badgeStyle}>Administrator</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Voice Settings */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={glassStyle}
        >
          <div style={sectionTitle}>
            <Mic size={18} color="#8aebff" />
            Voice Settings
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={fieldRow}>
              <span style={fieldLabel}>Wake Word ("Hey Devi")</span>
              <div
                style={toggleTrack(wakeWord)}
                onClick={() => setWakeWord((p) => !p)}
              >
                <div style={{ ...toggleThumb, left: wakeWord ? 23 : 3 }} />
              </div>
            </div>
            <div style={{ padding: "12px 0" }}>
              <label style={fieldLabel}>
                Sensitivity: {sensitivity}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                style={{
                  width: "100%",
                  marginTop: 8,
                  accentColor: "#8aebff",
                }}
              />
            </div>
            <div style={fieldRow}>
              <span style={fieldLabel}>Voice Response</span>
              <div
                style={toggleTrack(voiceResponse)}
                onClick={() => setVoiceResponse((p) => !p)}
              >
                <div style={{ ...toggleThumb, left: voiceResponse ? 23 : 3 }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Provider */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={glassStyle}
        >
          <div style={sectionTitle}>
            <Cpu size={18} color="#8aebff" />
            AI Provider
          </div>
          <div>
            <label style={labelStyle}>Model</label>
            <select
              style={selectStyle}
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
            >
              <option value="GPT-4">GPT-4</option>
              <option value="Claude 3">Claude 3</option>
              <option value="Local LLM">Local LLM</option>
            </select>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={glassStyle}
        >
          <div style={sectionTitle}>
            <Bell size={18} color="#8aebff" />
            Notifications
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={fieldRow}>
              <span style={fieldLabel}>Email Alerts</span>
              <div
                style={toggleTrack(emailAlerts)}
                onClick={() => setEmailAlerts((p) => !p)}
              >
                <div style={{ ...toggleThumb, left: emailAlerts ? 23 : 3 }} />
              </div>
            </div>
            <div style={fieldRow}>
              <span style={fieldLabel}>Desktop Notifications</span>
              <div
                style={toggleTrack(desktopNotif)}
                onClick={() => setDesktopNotif((p) => !p)}
              >
                <div style={{ ...toggleThumb, left: desktopNotif ? 23 : 3 }} />
              </div>
            </div>
            <div style={fieldRow}>
              <span style={fieldLabel}>Sound Effects</span>
              <div
                style={toggleTrack(soundFx)}
                onClick={() => setSoundFx((p) => !p)}
              >
                <div style={{ ...toggleThumb, left: soundFx ? 23 : 3 }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.25 }}
          style={glassStyle}
        >
          <div style={sectionTitle}>
            <Palette size={18} color="#8aebff" />
            Theme
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Current Theme</span>
            <span style={badgeStyle}>Dark Mode</span>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            ...glassStyle,
            border: "1px solid rgba(255, 180, 171, 0.2)",
          }}
        >
          <div style={sectionTitle}>
            <AlertTriangle size={18} color="#ffb4ab" />
            Danger Zone
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={dangerBtn} onClick={handleReset}>
              Reset Configuration
            </button>
            <button
              style={{
                ...dangerBtn,
                background: "rgba(255, 180, 171, 0.15)",
              }}
              onClick={handleDelete}
            >
              Delete Account
            </button>
          </div>
        </motion.div>

        {/* Save */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <button
            style={{
              ...primaryBtn,
              opacity: saved ? 0.85 : 1,
            }}
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              <>
                <Save size={18} /> Save Changes
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AppShell>
  )
}

