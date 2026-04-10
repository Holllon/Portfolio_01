import Link from "next/link"
import { notFound } from "next/navigation"
import { experiments } from "@/lib/data"

export function generateStaticParams() {
  return experiments.map((exp) => ({
    slug: exp.slug,
  }))
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const experiment = experiments.find((exp) => exp.slug === slug)
  
  if (!experiment) return notFound()

  // Find next project
  const currentIndex = experiments.findIndex((exp) => exp.slug === slug)
  const nextExperiment = experiments[(currentIndex + 1) % experiments.length]

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-accent">
      <div className="relative py-8 md:py-32 px-6 md:px-28 max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="mb-24 flex items-center justify-between border-b border-border/40 pb-6 relative z-30">
          <Link 
            href="/" 
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
          >
            &larr; Back to Home
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Project / {String(currentIndex + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Content */}
        <div className="mb-24 relative">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 block">
            {experiment.medium}
          </span>
          <h1 className="font-[var(--font-bebas)] text-6xl md:text-8xl tracking-tight mb-8">
            {experiment.title}
          </h1>
          <p className="font-mono text-sm md:text-base text-muted-foreground leading-relaxed md:max-w-xl">
            {experiment.description}
            <br /><br />
            This is an expanded view of the project. Here we would include more details, screenshots, and visual explorations related to the creation and thought process behind this interface study. The architecture involves meticulous attention to typography, spatial distribution, and interaction paradigms.
          </p>
        </div>

        {/* Next Project */}
        <div className="mt-32 pt-12 border-t border-border/40 relative z-30">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 block">
            Next Project
          </span>
          <Link 
            href={`/work/${nextExperiment.slug}`}
            className="group block"
          >
            <h2 className="font-[var(--font-bebas)] text-4xl md:text-6xl tracking-tight group-hover:text-accent transition-colors duration-300">
              {nextExperiment.title}
            </h2>
            <div className="w-12 h-px bg-accent/60 mt-6 group-hover:w-full transition-all duration-500" />
          </Link>
        </div>
      </div>
    </main>
  )
}
