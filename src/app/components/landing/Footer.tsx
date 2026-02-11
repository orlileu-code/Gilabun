"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"

const footerLinks = {
  Product: ["Features", "How It Works", "Pricing"],
  Resources: ["Documentation", "Support", "Blog"],
  Company: ["About", "Contact", "Privacy"],
}

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer ref={ref} className="border-t border-brown-200 bg-brown-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brown-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <span className="font-semibold text-brown-900">TableFlow</span>
            </Link>
            <p className="text-sm text-brown-600 mb-4">
              The modern platform for restaurants who want smoother service.
            </p>
            {/* System Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brown-200">
              <span className="w-2 h-2 rounded-full bg-brown-700 pulse-glow" />
              <span className="text-xs text-brown-600">All Systems Operational</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-brown-900 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-brown-600 hover:text-brown-900 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-brown-200 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-brown-600">
            &copy; {new Date().getFullYear()} TableFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-brown-600 hover:text-brown-900 transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-brown-600 hover:text-brown-900 transition-colors">
              GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
