"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "./Button"

const textRevealVariants = {
  hidden: { y: "100%" },
  visible: (i: number) => ({
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: i * 0.1,
    },
  }),
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden bg-[#FFFFFF]">
      {/* Pure white → light gray gradient, no yellow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#FFFFFF] to-[#F5F5F5] pointer-events-none" />

      {/* Neutral gray glow only */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#E5E5E5]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge – pure white + black/gray only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#D4D4D4] mb-8 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#1A1814] pulse-glow" />
          <span className="text-sm text-[#1A1814]">Designed for busy hosts &amp; floor managers</span>
        </motion.div>

        {/* Headline with text mask animation */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1A1814] mb-6">
          <span className="block overflow-hidden">
            <motion.span className="block" variants={textRevealVariants} initial="hidden" animate="visible" custom={0}>
              Seat smarter.
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block text-[#3D2C22]"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Serve faster.
            </motion.span>
          </span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-[#3D2C22] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          TableFlow keeps your floor map and waitlist in perfect sync. A visual dashboard that helps restaurants
          reduce wait times, eliminate walk-outs, and deliver smoother service.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            className="shimmer-btn bg-[#1A1814] text-white hover:bg-black rounded-full px-8 h-12 text-base font-medium shadow-lg border border-[#1A1814]/20"
            href="/app"
          >
            Start Using TableFlow
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-base font-medium border-[#D4D4D4] text-[#1A1814] hover:bg-[#FAFAFA] hover:border-[#A3A3A3] bg-[#FFFFFF]"
            href="/app"
          >
            View Demo
          </Button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-sm text-[#3D2C22]">
            Trusted by <span className="text-[#1A1814] font-medium">restaurants</span> worldwide
          </p>
        </motion.div>
      </div>
    </section>
  )
}
