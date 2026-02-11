"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export function PersonalStory() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto"
      >
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 md:p-10">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Why I built TableFlow
          </h2>
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <p>
              After years working in restaurants, I saw the same problem everywhere: hosts juggling paper waitlists, managers guessing at table availability, and guests waiting longer than they should. The tools that existed were either too expensive, too complicated, or didn&apos;t match how restaurants actually work.
            </p>
            <p>
              TableFlow started as a simple idea: what if the hostess stand had a visual floor map that showed exactly which tables were free, occupied, or turning? What if the waitlist could automatically suggest the best table for the next party? What if everyone—hosts, managers, servers—could see the same real-time picture?
            </p>
            <p>
              I built TableFlow to be the tool I wish I had when I was managing the floor. It&apos;s designed for speed: drag a party onto a table to seat them, mark tables as turning with one click, see who&apos;s next in line at a glance. No training required, no expensive hardware—just open it in a browser and start using it.
            </p>
            <p className="font-medium text-white pt-2">
              If you&apos;re running a busy restaurant and want smoother service, fewer walk-outs, and happier guests, TableFlow can help. Try it tonight and see the difference it makes.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
