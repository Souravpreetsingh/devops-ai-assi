"use client"

import { useEffect, useRef } from "react"

interface AICoreProps {
  size?: number
  pulse?: boolean
  className?: string
}

export default function AICore({ size = 200, pulse = true, className = "" }: AICoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const center = size / 2
    const baseRadius = size * 0.25
    let time = 0

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = (e.clientX - rect.left) / rect.width
      mouseRef.current.y = (e.clientY - rect.top) / rect.height
    }
    window.addEventListener("mousemove", handleMouse)

    const animate = () => {
      time += 0.008
      ctx!.clearRect(0, 0, size, size)

      const mx = (mouseRef.current.x - 0.5) * 12
      const my = (mouseRef.current.y - 0.5) * 12

      // Outer glow layer
      const glowGrad = ctx!.createRadialGradient(center + mx, center + my, 0, center + mx, center + my, baseRadius * 2.5)
      glowGrad.addColorStop(0, "rgba(34,211,238,0.06)")
      glowGrad.addColorStop(0.5, "rgba(34,211,238,0.02)")
      glowGrad.addColorStop(1, "rgba(34,211,238,0)")
      ctx!.fillStyle = glowGrad
      ctx!.fillRect(0, 0, size, size)

      // Orb body
      const orbGrad = ctx!.createRadialGradient(center + mx - 10, center + my - 10, 0, center + mx, center + my, baseRadius)
      orbGrad.addColorStop(0, "rgba(80, 240, 255, 0.9)")
      orbGrad.addColorStop(0.3, "rgba(34, 211, 238, 0.7)")
      orbGrad.addColorStop(0.7, "rgba(0, 150, 200, 0.4)")
      orbGrad.addColorStop(1, "rgba(0, 100, 150, 0.1)")

      ctx!.beginPath()
      ctx!.arc(center + mx, center + my, baseRadius, 0, Math.PI * 2)
      ctx!.fillStyle = orbGrad
      ctx!.fill()

      // Inner core glow
      const coreGrad = ctx!.createRadialGradient(center + mx, center + my, 0, center + mx, center + my, baseRadius * 0.4)
      coreGrad.addColorStop(0, "rgba(255,255,255,0.8)")
      coreGrad.addColorStop(0.5, "rgba(34,211,238,0.3)")
      coreGrad.addColorStop(1, "rgba(34,211,238,0)")
      ctx!.beginPath()
      ctx!.arc(center + mx, center + my, baseRadius * 0.4, 0, Math.PI * 2)
      ctx!.fillStyle = coreGrad
      ctx!.fill()

      // Rotating ring 1 (outer)
      ctx!.save()
      ctx!.translate(center + mx, center + my)
      ctx!.rotate(time * 0.6)
      ctx!.beginPath()
      ctx!.arc(0, 0, baseRadius * 1.6, 0, Math.PI * 1.5)
      ctx!.strokeStyle = "rgba(34,211,238,0.2)"
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      // Ring 1 glow dots
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i + time * 0.6
        const x = Math.cos(angle) * baseRadius * 1.6
        const y = Math.sin(angle) * baseRadius * 1.6
        ctx!.beginPath()
        ctx!.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(34,211,238,${0.4 + Math.sin(time * 2 + i) * 0.3})`
        ctx!.fill()
      }
      ctx!.restore()

      // Rotating ring 2 (inner, counter-rotating)
      ctx!.save()
      ctx!.translate(center + mx, center + my)
      ctx!.rotate(-time * 0.9)
      ctx!.beginPath()
      ctx!.arc(0, 0, baseRadius * 1.1, 0, Math.PI * 1.2)
      ctx!.strokeStyle = "rgba(168,85,247,0.15)"
      ctx!.lineWidth = 1
      ctx!.stroke()

      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 / 4) * i - time * 0.9
        const x = Math.cos(angle) * baseRadius * 1.1
        const y = Math.sin(angle) * baseRadius * 1.1
        ctx!.beginPath()
        ctx!.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(168,85,247,${0.3 + Math.sin(time * 1.5 + i) * 0.2})`
        ctx!.fill()
      }
      ctx!.restore()

      // Rotating ring 3 (scattered particles)
      ctx!.save()
      ctx!.translate(center + mx, center + my)
      ctx!.rotate(time * 0.3)
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + time * 0.3
        const radius = baseRadius * (1.3 + Math.sin(time + i) * 0.2)
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        ctx!.beginPath()
        ctx!.arc(x, y, 1, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(time * 2 + i * 0.5) * 0.15})`
        ctx!.fill()
      }
      ctx!.restore()

      // Pulsing ring
      if (pulse) {
        const pulseRadius = baseRadius * (1.8 + Math.sin(time * 3) * 0.3)
        ctx!.beginPath()
        ctx!.arc(center + mx, center + my, pulseRadius, 0, Math.PI * 2)
        ctx!.strokeStyle = `rgba(34,211,238,${0.08 - Math.sin(time * 3) * 0.04})`
        ctx!.lineWidth = 1
        ctx!.stroke()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("mousemove", handleMouse)
    }
  }, [size, pulse])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        filter: "blur(0.5px)",
        transform: "translate3d(0,0,0)",
      }}
    />
  )
}
