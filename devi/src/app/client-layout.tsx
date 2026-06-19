"use client"

import { ReactNode, useState } from "react"
import { usePathname } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth"
import Sidebar from "@/components/Sidebar"
import Particles from "@/components/Particles"
import BootScreen from "@/components/BootScreen"
import AuthGuard from "@/components/AuthGuard"

function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [booted, setBooted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("devi_booted") === "true"
    }
    return false
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleBootComplete = () => {
    setBooted(true)
    localStorage.setItem("devi_booted", "true")
  }

  const isPublic = pathname === "/login" || pathname === "/"
  const showSidebar = user && !isPublic
  const sidebarWidth = sidebarCollapsed ? "64px" : "240px"

  if (!booted && !isPublic) {
    return <BootScreen onComplete={handleBootComplete} />
  }

  return (
    <>
      {/* Ambient lighting orbs */}
      {!isPublic && (
        <>
          <div className="fixed top-0 left-0 w-[60vw] h-[60vh] pointer-events-none z-0"
            style={{
              background: "radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.03), transparent 70%)",
            }}
          />
          <div className="fixed bottom-0 right-0 w-[50vw] h-[50vh] pointer-events-none z-0"
            style={{
              background: "radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.025), transparent 70%)",
            }}
          />
          <Particles count={40} color="34,211,238" speed={0.15} interactive />
        </>
      )}
      {showSidebar && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}
      <main
        className="transition-all duration-300 relative z-10"
        style={{ marginLeft: showSidebar ? sidebarWidth : "0" }}
      >
        {children}
      </main>
    </>
  )
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <InnerLayout>{children}</InnerLayout>
    </AuthProvider>
  )
}

function InnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPublic = pathname === "/login" || pathname === "/"

  if (isPublic) {
    return <LayoutShell>{children}</LayoutShell>
  }

  return (
    <AuthGuard>
      <LayoutShell>{children}</LayoutShell>
    </AuthGuard>
  )
}
