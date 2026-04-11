"use client"

import { useEffect, useRef } from "react"

interface AnimatedNoiseProps {
  opacity?: number
  className?: string
  fadeBottom?: boolean
  fadeStart?: number
}

const FRAME_COUNT = 10
const TARGET_FPS = 10

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

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Используем реальный размер экрана как в оригинале (/2 для экономии),
    // но теперь с ImageBitmap — данные заливаются в GPU один раз
    const W = Math.round(canvas.offsetWidth / 2) || 720
    const H = Math.round(canvas.offsetHeight / 2) || 450
    canvas.width = W
    canvas.height = H

    let animationId: number
    let bitmaps: ImageBitmap[] = []

    const init = async () => {
      // Генерируем кадры один раз на CPU
      const imageDatas = Array.from({ length: FRAME_COUNT }, () => {
        const imageData = new ImageData(W, H)
        const buf = new Uint32Array(imageData.data.buffer)
        for (let i = 0; i < buf.length; i++) {
          const v = (Math.random() * 255) | 0
          buf[i] = (0xff << 24) | (v << 16) | (v << 8) | v
        }
        return imageData
      })

      // Загружаем в GPU один раз — дальше CPU не участвует
      bitmaps = await Promise.all(imageDatas.map(d => createImageBitmap(d)))
      ctx.drawImage(bitmaps[0], 0, 0)

      let frameIndex = 0
      let lastTime = 0
      const interval = 1000 / TARGET_FPS

      const animate = (time: number) => {
        animationId = requestAnimationFrame(animate)
        if (time - lastTime < interval) return
        lastTime = time
        frameIndex = (frameIndex + 1) % FRAME_COUNT
        ctx.drawImage(bitmaps[frameIndex], 0, 0)
      }

      animationId = requestAnimationFrame(animate)
    }

    init()

    return () => {
      cancelAnimationFrame(animationId)
      bitmaps.forEach(b => b.close())
    }
  }, [])

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
        imageRendering: "auto",
        willChange: "transform",
        WebkitMaskImage: maskValue,
        maskImage: maskValue,
      }}
    />
  )
}
