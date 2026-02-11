"use client"

import { SmoothScroll } from "./components/landing/SmoothScroll"
import { Navbar } from "./components/landing/Navbar"
import { Hero } from "./components/landing/Hero"
import { LogoMarquee } from "./components/landing/LogoMarquee"
import { BentoGrid } from "./components/landing/BentoGrid"
import { Reviews } from "./components/landing/Reviews"
import { PersonalStory } from "./components/landing/PersonalStory"
import { FinalCTA } from "./components/landing/FinalCTA"
import { Footer } from "./components/landing/Footer"
import { PricingSection } from "./components/landing/PricingSection"

export default function LandingPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-brown-50">
        <Navbar />
        <Hero />
        <LogoMarquee />
        <BentoGrid />
        <Reviews />
        <PersonalStory />
        <PricingSection />
        <FinalCTA />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
