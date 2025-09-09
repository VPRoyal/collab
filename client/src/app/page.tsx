"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Github, Sparkles, PlayCircle } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) router.push("/docs")
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      {/* === Hero Section === */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white">
        {/* Icon */}
        <div className="inline-flex items-center justify-center mb-6">
          <div className="h-20 w-20 rounded-3xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg shadow-black/30">
            <Sparkles className="h-10 w-10 text-white drop-shadow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
          Collab
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-light">
          Real‑time <span className="font-semibold">collaborative editing</span> 
          with awareness, chat & presence — powered by <span className="font-semibold">Yjs + Socket.IO</span>.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-white text-violet-600 hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-lg shadow-black/30 transition-transform hover:scale-105"
            onClick={() => router.push("/login")}
          >
            Get Started →
          </Button>

          <a
            href="https://github.com/VPRoyal/collab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white/20 shadow-md transition-colors"
          >
            <Github className="w-5 h-5" />
            GitHub
          </a>
        </div>
      </section>

      {/* === Demo Section === */}
      <section className="w-full bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800">See it in Action</h2>
          <p className="text-gray-500 mt-2 mb-8">
            Watch a quick demo walkthrough of Collab in action.
          </p>

          <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="aspect-video w-full bg-black">
              {/* Replace with your Loom link */}
<div className="relative pb-[56.25%] h-0">
      <iframe
        className="absolute inset-0 w-full h-full"
        src="https://www.loom.com/embed/43386bde795a4b91a75e36ba34a89e1c?sid=7fee4a32-1a8c-4b87-a16a-1a50246636d0"
        title="Project demo — Jafe Empreendimentos"
        frameBorder={0}
        loading="lazy"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>         </div>
          </div>

          <div className="mt-3 flex justify-center text-gray-600 text-sm items-center">
            <PlayCircle className="w-4 h-4 mr-2" /> Live Demo Walkthrough
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm">
        🚀 Built with Next.js, Yjs, Socket.IO, shadcn/ui & TailwindCSS
      </footer>
    </div>
  )
}