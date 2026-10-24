import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../components/SectionEyebrow'
import FilscapPanel from './services/components/FilscapPanel'
import ServiceGroup from './services/components/ServiceGroup'
import ServicesCta from './services/components/ServicesCta'
import SubscriptionPanel from './services/components/SubscriptionPanel'
import VipPanel from './services/components/VipPanel'
import { serviceGroups } from './services/data'

gsap.registerPlugin(ScrollTrigger)

export default function Services() {
  const pageRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={pageRef} className="py-8">
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

      <section data-services-hero className="mt-8 max-w-4xl">
        <SectionEyebrow>Music Production · Recording · Artist Services · Online Music</SectionEyebrow>
        <h1 className="mt-3 font-heading text-4xl leading-none font-bold tracking-wide uppercase sm:text-5xl">
          BTP Music Production
        </h1>
        <p className="mt-4 font-heading text-2xl leading-tight font-bold tracking-wide text-primary uppercase sm:text-3xl">
          Your Music, Our Passion, Your Success!
        </p>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-secondary">
          BTP Music Production provides music production, recording, artist development, live
          entertainment, karaoke music video production, and online music services. We support
          singers, songwriters, composers, musicians, and independent artists in developing and
          promoting their music.
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover"
        >
          Inquire &amp; Book
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
        </Link>
      </section>

      {serviceGroups.map((group) => (
        <ServiceGroup key={group.id} group={group} />
      ))}

      <FilscapPanel />
      <SubscriptionPanel />
      <VipPanel />
      <ServicesCta />
    </div>
  )
}
