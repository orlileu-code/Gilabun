"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { LayoutGrid, Clock, Users, MapPin, Zap, TrendingUp } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to manage your floor
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Built for modern restaurants. Powerful features that help you seat guests faster and reduce wait times.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Large card - Live Floor Map */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
                  <MapPin className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Live Floor Map</h3>
                <p className="text-zinc-400 text-sm">
                  Visual floor plan that shows table status in real-time. Drag-and-drop builder matches your exact layout.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["FREE", "OCCUPIED", "TURNING"].map((status) => (
                <div key={status} className="text-center p-3 rounded-lg bg-zinc-800">
                  <div className={`text-lg font-bold mb-1 ${
                    status === "FREE" ? "text-emerald-400" : 
                    status === "OCCUPIED" ? "text-orange-400" : 
                    "text-red-400"
                  }`}>
                    {status}
                  </div>
                  <div className="text-xs text-zinc-500">Status</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Smart Waitlist */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
              <Users className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Waitlist</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Track parties, quoted wait times, and automatically suggest the best table for the next guest.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-mono">Auto-suggest</span>
            </div>
          </motion.div>

          {/* Real-time Sync */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
              <Zap className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Sync</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Powered by Firebase. Everyone sees the same picture—hosts, managers, and servers.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <span className="font-mono">~50ms</span>
              <span className="text-zinc-500">sync time</span>
            </div>
          </motion.div>

          {/* Drag & Drop Seating */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
              <LayoutGrid className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Drag & Drop Seating</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Seat parties in seconds. Drag a party from the waitlist onto any available table.
            </p>
            <div className="text-emerald-400 text-sm font-medium">Instant updates</div>
          </motion.div>

          {/* Analytics & Insights */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Wait Time Tracking</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Monitor average wait times, table turnover, and identify bottlenecks in real-time.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-zinc-800 rounded text-zinc-400">Live metrics</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
