"use client"

import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      <style>{`
        body { background: #0a0a0f !important; }
        body::after { display: none !important; }
      `}</style>

      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/40 to-[#0a0a0f]/80" />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(138,235,255,0.06), transparent 70%)" }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Nav */}
        <nav className="flex items-center justify-end pt-4 sm:pt-6 px-4 sm:px-8">
          <button
            onClick={() => router.push('/login')}
            className="group relative inline-flex items-center gap-4 px-10 py-4 rounded-2xl text-lg sm:text-xl font-semibold transition-all duration-500"
            style={{
              background: "linear-gradient(135deg, #8aebff, #6f00be)",
              color: "white",
              boxShadow: "0 0 40px rgba(138,235,255,0.15), 0 0 80px rgba(111,0,190,0.1)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 60px rgba(138,235,255,0.25), 0 0 120px rgba(111,0,190,0.2)"
              e.currentTarget.style.transform = "scale(1.05)"
              e.currentTarget.style.letterSpacing = "0.02em"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 0 40px rgba(138,235,255,0.15), 0 0 80px rgba(111,0,190,0.1)"
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.letterSpacing = "normal"
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start
          </button>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-8">

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-center leading-tight"
              style={{
                background: "linear-gradient(135deg, #8aebff 0%, #ddb7ff 50%, #8aebff 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 4s ease-in-out infinite",
              }}
            >
              Devi AI Assistant
            </h1>
            <p className="text-base sm:text-lg text-center max-w-xl"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
              AI-POWERED DEVOPS INFRASTRUCTURE
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
