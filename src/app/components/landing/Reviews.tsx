"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const reviews = [
  {
    stars: 5,
    quote: "Finally, a tool that shows me exactly which tables are free and who's waiting. No more guessing or running back and forth.",
    author: "Sarah M.",
    role: "Hostess"
  },
  {
    stars: 5,
    quote: "The drag-and-drop seating is a game changer. I can seat parties in seconds and everyone on the floor sees it instantly.",
    author: "Marcus T.",
    role: "Floor Manager"
  },
  {
    stars: 5,
    quote: "We've cut wait times by 20% and walk-outs are way down. The visual floor map makes everything so much clearer.",
    author: "Jessica L.",
    role: "Restaurant Owner"
  }
]

export function Reviews() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="reviews" ref={ref} className="py-24 px-4 bg-amber-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-4">
            What hosts are saying
          </h2>
          <p className="text-brown-600 max-w-2xl mx-auto">
            Real feedback from restaurants using TableFlow to streamline their service.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="rounded-xl border border-brown-200 bg-white p-6 hover:border-brown-300 transition-all shadow-sm"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(review.stars)].map((_, i) => (
                  <span key={i} className="text-amber-500 text-sm">★</span>
                ))}
              </div>
              <p className="text-brown-700 mb-4 italic leading-relaxed">
                &quot;{review.quote}&quot;
              </p>
              <div>
                <p className="text-sm font-medium text-brown-900">{review.author}</p>
                <p className="text-xs text-brown-500">{review.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
