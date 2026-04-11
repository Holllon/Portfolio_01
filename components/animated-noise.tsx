"use client"

import { useEffect, useRef } from "react"

interface AnimatedNoiseProps {
  opacity?: number
  className?: string
  fadeBottom?: boolean
  fadeStart?: number
}

const NOISE_W = 256       // немного больше для качества, но всё ещё маленький
const NOISE_H = 256
const FRAME_COUNT = 10    // 10 кадров достаточно
const TARGET_FPS = 10     // 10 fps — незаметно для глаза, дёшево для CPU

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

    canvas.width = NOISE_W
    canvas.height = NOISE_H

    let animationId: number
    let bitmaps: ImageBitmap[] = []

    const init = async () => {
      // 1. Генерируем пиксели один раз на CPU
      const imageDatas = Array.from({ length: FRAME_COUNT }, () => {
        const imageData = new ImageData(NOISE_W, NOISE_H)
        const buf = new Uint32Array(imageData.data.buffer)
        for (let i = 0; i < buf.length; i++) {
          const v = (Math.random() * 255) | 0
          // little-endian RGBA: R=v, G=v, B=v, A=255
          buf[i] = (0xff << 24) | (v << 16) | (v << 8) | v
        }
        return imageData
      })

      // 2. Загружаем все кадры в GPU как ImageBitmap — один раз и навсегда
      //    После этого CPU не участвует в отрисовке вообще
      bitmaps = await Promise.all(imageDatas.map(d => createImageBitmap(d)))

      // Рисуем первый кадр сразу
      ctx.drawImage(bitmaps[0], 0, 0)

      let frameIndex = 0
      let lastTime = 0
      const interval = 1000 / TARGET_FPS

      const animate = (time: number) => {
        animationId = requestAnimationFrame(animate)
        if (time - lastTime < interval) return  // пропускаем кадр если не пришло время
        lastTime = time
        frameIndex = (frameIndex + 1) % FRAME_COUNT
        // drawImage(ImageBitmap) = GPU→GPU, нет передачи данных через CPU вообще
        ctx.drawImage(bitmaps[frameIndex], 0, 0)
      }

      animationId = requestAnimationFrame(animate)
    }

    init()

    return () => {
      cancelAnimationFrame(animationId)
      // Освобождаем GPU память при размонтировании
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
        // Ключевое: даём canvas собственный GPU-слой.
        // Без этого mix-blend-mode вызывает перерисовку всей страницы каждый кадр.
        // С этим — только этот слой обновляется, GPU-compositing.
        willChange: "transform",
        WebkitMaskImage: maskValue,
        maskImage: maskValue,
      }}
    />
  )
}
