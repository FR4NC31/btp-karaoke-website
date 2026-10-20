import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../components/SectionEyebrow'
import OperationalMatrix from './services/components/OperationalMatrix'
import RateStrip from './services/components/RateStrip'
import ServiceWing from './services/components/ServiceWing'
import ServicesCta from './services/components/ServicesCta'
import { filters, wings, type FilterId } from './services/data'

gsap.registerPlugin(ScrollTrigger)

export default function Services() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<FilterId>('all')

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animation = gsap.context(() => {
      gsap.fromTo(
        '[data-services-hero] > *',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.1 },
      )

      gsap.utils.toArray<HTMLElement>('[data-services-reveal]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
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

  const visibleWings = wings.filter((wing) => filter === 'all' || wing.id === filter)

  return (
    <div ref={pageRef} className="py-8">
      {/* Breadcrumb + accreditation pill */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-widest uppercase">
          <Link to="/" className="text-primary hover:text-primary-hover">
            Home
          </Link>
          <span className="text-text-muted"> / Services</span>
        </nav>
        <p className="rounded-md border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold tracking-widest text-text-secondary uppercase">
          FILSCAP-Accredited Studio Services
        </p>
      </div>

      {/* Hero */}
      <section data-services-hero className="mt-8">
        <h1 className="font-heading text-4xl leading-none font-bold tracking-wide uppercase sm:text-5xl">
          BTP Music Production
        </h1>
        <div className="mt-5">
          <SectionEyebrow>Services</SectionEyebrow>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Comprehensive audio production, broadcast promotion, musicianship training, and official FILSCAP rights
          management for Filipino songwriters and artists.
        </p>
      </section>

      <RateStrip />

      {/* Filter tabs */}
      <div role="tablist" aria-label="Service categories" className="mt-12 flex flex-wrap gap-3">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-5 py-3 text-left transition ${
              filter === f.id
                ? 'bg-primary-soft text-text-primary'
                : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="block text-xs font-bold tracking-widest uppercase">{f.label}</span>
            <span className="mt-1 block text-[10px] tracking-widest text-text-muted uppercase">{f.hint}</span>
          </button>
        ))}
        <div className="flex items-center gap-2 rounded-lg bg-surface px-5 py-3 text-text-secondary">
          <span aria-hidden="true">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />
          </span>
          <span className="text-xs font-bold tracking-widest uppercase">
            Modular studio
            <br />
            capabilities
          </span>
        </div>
      </div>

      {visibleWings.map((wing) => (
        <ServiceWing key={wing.id} wing={wing} />
      ))}

      <OperationalMatrix />
      <ServicesCta />
    </div>
  )
}
