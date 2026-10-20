import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AboutCta from './about/components/AboutCta'
import AboutHero from './about/components/AboutHero'
import Commitments from './about/components/Commitments'
import StatsStrip from './about/components/StatsStrip'
import StoryVision from './about/components/StoryVision'
import WhatWeDo from './about/components/WhatWeDo'

gsap.registerPlugin(ScrollTrigger)

export default function About() {
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animation = gsap.context(() => {
      // Hero plays on load; everything below reveals as it scrolls into view.
      gsap.fromTo(
        '[data-about-hero] > *',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.1 },
      )

      gsap.utils.toArray<HTMLElement>('[data-about-reveal]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            // Stagger siblings that enter together (e.g. card grids).
            delay: (i % 4) * 0.08,
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          },
        )
      })
    }, page)

    return () => animation.revert()
  }, [])

  return (
    <div ref={pageRef} className="py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-widest uppercase">
        <Link to="/" className="text-primary hover:text-primary-hover">
          Home
        </Link>
        <span className="text-text-muted"> / About Us</span>
      </nav>

      <AboutHero />
      <StatsStrip />
      <WhatWeDo />
      <StoryVision />
      <Commitments />
      <AboutCta />
    </div>
  )
}
