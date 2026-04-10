"use client"

import { useEffect, useRef } from "react"

interface AnimatedNoiseProps {
  opacity?: number
  className?: string
  fadeBottom?: boolean // плавное растворение снизу
  fadeStart?: number  // с какого % высоты начинается fade (0–100), по умолчанию 55
}

// Fixed small canvas size — browser GPU will scale it up via CSS.
// At 3% opacity with overlay blend mode the upscaling is imperceptible.
const NOISE_SIZE = 200    // 200×200 px canvas (vs ~720×450 before = 8× fewer pixels)
const FRAME_COUNT = 12    // pre-generated frames to cycle through
const TARGET_FPS = 12     // 12 fps is plenty for film grain

export function AnimatedNoise({
  opacity = 0.05,
  className,
  fadeBottom = false,
  fadeStart = 55,
}: AnimatedNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // alpha: false — slight perf win, we don't need transparency on the canvas itself
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    canvas.width = NOISE_SIZE
    canvas.height = NOISE_SIZE

    // ─── Pre-generate all frames ONCE at mount ───────────────────────────────
    // Math.random() is never called again after this point.
    // Total cost: 200×200×12 = 480 000 iterations — happens once, not per frame.
    const frames: ImageData[] = Array.from({ length: FRAME_COUNT }, () => {
      const imageData = ctx.createImageData(NOISE_SIZE, NOISE_SIZE)
      // Uint32Array view lets us write R+G+B+A in one operation (4× faster than byte-by-byte)
      const buf = new Uint32Array(imageData.data.buffer)
      for (let i = 0; i < buf.length; i++) {
        const v = (Math.random() * 255) | 0
        // Canvas pixel layout in memory (little-endian): R G B A
        // As a Uint32: 0xAA_BB_GG_RR  →  alpha=0xff, blue=v, green=v, red=v
        buf[i] = (0xff << 24) | (v << 16) | (v << 8) | v
      }
      return imageData
    })

    // Draw first frame immediately so there's no blank flash
    ctx.putImageData(frames[0], 0, 0)

    // ─── Animation loop — zero CPU math, just a memory copy at 12 fps ────────
    let animationId: number
    let frameIndex = 0
    let lastTime = 0
    const interval = 1000 / TARGET_FPS

    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate)
      if (time - lastTime < interval) return   // skip frame — haven't hit target fps yet
      lastTime = time
      frameIndex = (frameIndex + 1) % FRAME_COUNT
      ctx.putImageData(frames[frameIndex], 0, 0)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  // Градиент маски: шум полностью виден сверху, плавно тает к низу
  const maskValue = fadeBottom
    ? `linear-gradient(to bottom, black ${fadeStart}%, transparent 100%)`
    : undefined

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
        // "auto" = bilinear scaling by GPU — soft grain, invisible at 3% opacity
        imageRendering: "auto",
        // Плавное растворение снизу через CSS mask
        WebkitMaskImage: maskValue,
        maskImage: maskValue,
      }}
    />
  )
}
