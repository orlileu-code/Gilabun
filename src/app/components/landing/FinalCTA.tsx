"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "./Button"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 px-4 bg-brown-100">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brown-900 mb-6 tracking-tight">
          Ready to streamline tonight&apos;s service?
        </h2>
        <p className="text-lg sm:text-xl text-brown-600 mb-10 max-w-2xl mx-auto">
          Join restaurants already using TableFlow. Start free, no credit card required. Just open your browser and begin.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="shimmer-btn bg-brown-700 text-white hover:bg-brown-800 rounded-full px-8 h-14 text-base font-medium shadow-lg shadow-brown-900/20"
            href="/login"
          >
            Get Started for Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-14 text-base font-medium border-brown-300 text-brown-700 hover:bg-white hover:text-brown-900 hover:border-brown-400 bg-transparent"
            href="/login"
          >
            Try Demo
          </Button>
        </div>

        <p className="mt-8 text-sm text-brown-500">Free forever for individual restaurants. No installation required.</p>
      </motion.div>
    </section>
  )
}
