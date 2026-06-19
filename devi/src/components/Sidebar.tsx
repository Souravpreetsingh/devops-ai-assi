"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "AI Chat", href: "/chat", icon: "smart_toy" },
  { label: "Deploy", href: "/deploy", icon: "rocket_launch" },
  { label: "Docker", href: "/docker", icon: "terminal" },
  { label: "Kubernetes", href: "/kubernetes", icon: "layers" },
  { label: "CI/CD", href: "/cicd", icon: "deployed_code" },
  { label: "Agent", href: "/agent", icon: "neurology" },
  { label: "Terminal", href: "/terminal", icon: "terminal" },
  { label: "Logs", href: "/logs", icon: "list_alt" },
  { label: "Monitoring", href: "/monitoring", icon: "monitoring" },
  { label: "Settings", href: "/settings", icon: "settings" },
]

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? "64px" : "240px" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      style={{
        background: "rgba(2, 6, 23, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "4px 0 40px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Brand + Toggle */}
      <div className={cn("flex items-center pt-5 pb-6", collapsed ? "justify-center px-0" : "justify-between px-3")}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 pl-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.2)",
                boxShadow: "0 0 20px rgba(34,211,238,0.12)",
              }}
            >
              <span className="text-primary text-lg font-display font-bold">D</span>
            </div>
            <div className="overflow-hidden">
              <h1 className="text-primary font-display text-lg tracking-tight whitespace-nowrap"
                style={{ textShadow: "0 0 12px rgba(34,211,238,0.3)" }}
              >
                Devi
              </h1>
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-on-surface-variant">v2.0.0</p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.2)",
              boxShadow: "0 0 15px rgba(34,211,238,0.08)",
            }}
          >
            <span className="text-primary text-lg font-display font-bold">D</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg text-sm transition-all duration-200 relative",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
              )}
              style={{
                color: active ? "#8aebff" : "rgba(255,255,255,0.45)",
              }}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: "rgba(34,211,238,0.07)",
                    border: "1px solid rgba(34,211,238,0.12)",
                    boxShadow: "0 0 20px rgba(34,211,238,0.06)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="material-symbols-outlined text-[20px] shrink-0 relative z-10" style={{ color: active ? "#8aebff" : undefined }} />
              {!collapsed && (
                <span className="font-medium truncate relative z-10">
                  {item.label}
                </span>
              )}
              {active && !collapsed && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                  style={{ background: "#8aebff", boxShadow: "0 0 8px rgba(34,211,238,0.5)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Toggle button */}
      <div className="px-2 pb-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-lg transition-all duration-200"
          style={{ color: "rgba(255,255,255,0.25)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#dce1fb"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            className="material-symbols-outlined text-[18px]"
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            chevron_left
          </motion.span>
        </button>
      </div>

      {/* User info */}
      {user && !collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 pb-3 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: "rgba(34,211,238,0.15)", color: "#8aebff" }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-on-surface truncate">{user.username}</p>
                <p className="text-[8px] font-mono text-on-surface-variant uppercase truncate">{user.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ffb4ab" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)" }}
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </motion.div>
      )}
    </motion.aside>
  )
}
