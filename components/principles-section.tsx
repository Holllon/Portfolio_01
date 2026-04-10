"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { HighlightText } from "@/components/highlight-text"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const principles = [
  {
    number: "01",
    titleParts: [
      { text: "INTERFACE", highlight: true },
      { text: " MINIMALISM", highlight: false },
    ],
    description: "Reduce until only the essential remains. Every element earns its place.",
    align: "left",
  },
  {
    number: "02",
    titleParts: [
      { text: "SYSTEMS", highlight: true },
      { text: " OVER SCREENS", highlight: false },
    ],
    description: "Design behaviors, not just layouts. Build logic that scales.",
    align: "right",
  },
  {
    number: "03",
    titleParts: [
      { text: "CONTROLLED ", highlight: false },
      { text: "TENSION", highlight: true },
    ],
    description: "Balance between restraint and expression. Confidence without excess.",
    align: "left",
  },
  {
    number: "04",
    titleParts: [
      { text: "SIGNAL ", highlight: false },
      { text: "CLARITY", highlight: true },
    ],
    description: "Communication that cuts through noise. Precision in every interaction.",
    align: "right",
  },
]

export function PrinciplesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLHeadingElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    const reveal = revealRef.current
    if (!section || !reveal) return

    // Cursor animations
    const wordElements = section.querySelectorAll(".base-article h3")

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Proximity-based scaling
      let minDistance = Infinity
      wordRefs.current.forEach((el) => {
        if (!el) return
        const elRect = el.getBoundingClientRect()
        const dx = Math.max(elRect.left - e.clientX, 0, e.clientX - elRect.right)
        const dy = Math.max(elRect.top - e.clientY, 0, e.clientY - elRect.bottom)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minDistance) minDistance = dist
      })

      let targetRadius = 34
      if (minDistance <= 80) {
        const progress = 1 - (minDistance / 80)
        targetRadius = 34 + progress * 66 // Expands wildly up to 100px radius (200px diameter)
      }

      gsap.to(reveal, {
        "--x": `${x}px`,
        "--y": `${y}px`,
        "--radius": `${targetRadius}px`,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto"
      })
    }

    const handleMouseEnter = () => {
      gsap.to(reveal, { "--radius": "34px", duration: 0.3, ease: "power2.out" })
    }
    const handleMouseLeave = () => {
      gsap.to(reveal, { "--radius": "0px", duration: 0.3, ease: "power2.in" })
    }

    section.addEventListener("mousemove", handleMouseMove)
    section.addEventListener("mouseenter", handleMouseEnter)
    section.addEventListener("mouseleave", handleMouseLeave)

    // Layout animations
    const ctx = gsap.context(() => {
      // Headers
      gsap.from(".base-header", {
        x: -60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".base-header",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      })
      gsap.from(".reveal-header", {
        x: -60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".base-header", // base triggers reveal
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      })

      // Articles
      const baseArticles = gsap.utils.toArray(".base-article") as HTMLElement[]
      const revealArticles = gsap.utils.toArray(".reveal-article") as HTMLElement[]

      baseArticles.forEach((article, index) => {
        const isRight = principles[index].align === "right"
        gsap.from(article, {
          x: isRight ? 80 : -80,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: article,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      })

      revealArticles.forEach((article, index) => {
        const isRight = principles[index].align === "right"
        gsap.from(article, {
          x: isRight ? 80 : -80,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: baseArticles[index], // sync with base
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      })
    }, sectionRef)

    return () => {
      section.removeEventListener("mousemove", handleMouseMove)
      section.removeEventListener("mouseenter", handleMouseEnter)
      section.removeEventListener("mouseleave", handleMouseLeave)

      ctx.revert()
    }
  }, [])

  const Content = ({ isReveal }: { isReveal: boolean }) => (
    <div className="py-32 pl-6 md:pl-28 pr-6 md:pr-12">
      <div className={cn("mb-24", isReveal ? "reveal-header text-black" : "base-header")}>
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.3em]", isReveal ? "text-black/60" : "text-accent")}>
          03 / Principles
        </span>
        <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">HOW WE WORK</h2>
      </div>

      <div className="space-y-24 md:space-y-32">
        {principles.map((principle, index) => (
          <article
            key={index}
            className={`flex flex-col ${
              principle.align === "right" ? "items-end text-right" : "items-start text-left"
            } ${isReveal ? "reveal-article text-black" : "base-article"}`}
          >
            <span className={cn("font-mono text-[10px] uppercase tracking-[0.3em] mb-4", isReveal ? "text-black/60" : "text-muted-foreground")}>
              {principle.number} / {principle.titleParts[0].text.split(" ")[0]}
            </span>

            <h3 
              ref={(el) => { if (!isReveal && el) wordRefs.current[index] = el }}
              className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-8xl tracking-tight leading-none"
            >
              {principle.titleParts.map((part, i) =>
                part.highlight ? (
                  <HighlightText key={i} parallaxSpeed={0.6} isReveal={isReveal}>
                    {part.text}
                  </HighlightText>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </h3>

            <p className={cn("mt-6 max-w-md font-mono text-sm leading-relaxed", isReveal ? "text-black/80" : "text-muted-foreground")}>
              {principle.description}
            </p>

            <div className={`mt-8 h-[1px] w-24 md:w-48 ${principle.align === "right" ? "mr-0" : "ml-0"} ${isReveal ? "bg-black/20" : "bg-border"}`} />
          </article>
        ))}
      </div>
    </div>
  )

  return (
    <section ref={sectionRef} id="principles" className="relative overflow-hidden cursor-none">
      {/* Base Layer */}
      <div className="w-full relative z-10">
        <Content isReveal={false} />
      </div>

      {/* Reveal Layer (Cursor spotlight mask) */}
      <div
        ref={revealRef}
        className="absolute inset-0 bg-accent z-50 pointer-events-none"
        style={{
          clipPath: "circle(var(--radius, 0px) at var(--x, 0px) var(--y, 0px))",
          WebkitClipPath: "circle(var(--radius, 0px) at var(--x, 0px) var(--y, 0px))",
        }}
      >
        <Content isReveal={true} />
      </div>
    </section>
  )
}
