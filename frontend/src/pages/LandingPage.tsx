import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Facebook01Icon, Mail01Icon, PhoneIcon } from '@hugeicons/core-free-icons'
import { useAuthDialog } from '../lib/auth-dialog'
import SectionEyebrow from '../components/SectionEyebrow'
import FilscapPanel from './services/components/FilscapPanel'
import ServiceGroup from './services/components/ServiceGroup'
import ServicesCta from './services/components/ServicesCta'
import SubscriptionPanel from './services/components/SubscriptionPanel'
import VipPanel from './services/components/VipPanel'
import { serviceGroups } from './services/data'
import AboutHero from './about/components/AboutHero'
import StatsStrip from './about/components/StatsStrip'
import WhatWeDo from './about/components/WhatWeDo'
import StoryVision from './about/components/StoryVision'
import Commitments from './about/components/Commitments'
import AboutCta from './about/components/AboutCta'

gsap.registerPlugin(ScrollTrigger)

const channels = [
  {
    icon: Facebook01Icon,
    title: 'Social Media',
    label: 'Facebook Page',
    value: 'BTP Music Production',
    desc: 'Official updates, new song announcements, minus-one catalog previews, and direct messenger inquiries.',
    action: 'Visit Our Page',
    href: 'https://www.facebook.com/profile.php?id=61560004453465',
    external: true,
  },
  {
    icon: Mail01Icon,
    title: 'Official Inbox',
    label: 'Email Address',
    value: 'btpproduction2024@gmail.com',
    desc: 'For songwriter demos, sync licensing, karaoke minus-one requests, and business collaborations.',
    action: 'Send Email',
    href: 'mailto:btpproduction2024@gmail.com',
    external: false,
  },
  {
    icon: PhoneIcon,
    title: 'Direct Phone & Mobile',
    label: 'Direct Number',
    value: '0932 973 6975',
    desc: 'Studio front desk and booking hotline.',
    action: 'Call Direct',
    href: 'tel:+639329736975',
    external: false,
  },
]

export default function LandingPage() {
  const { openAuth } = useAuthDialog()
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sections = ['services', 'about', 'contact']
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            const newHash = id ? `#${id}` : ''
            if (window.location.hash !== newHash) {
              window.history.replaceState(null, '', newHash || '/')
              window.dispatchEvent(new HashChangeEvent('hashchange'))
            }
          }
        })
      },
      { threshold: 0.3 }
    )

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    const heroEl = document.getElementById('hero')
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && window.scrollY < 300) {
            if (window.location.hash) {
              window.history.replaceState(null, '', '/')
              window.dispatchEvent(new HashChangeEvent('hashchange'))
            }
          }
        })
      },
      { threshold: 0.5 }
    )
    if (heroEl) heroObserver.observe(heroEl)

    const animation = gsap.context(() => {
      const entrance = gsap.timeline({
        defaults: { duration: 0.65, ease: 'power3.out' },
      })

      entrance
        .fromTo(
          '[data-landing-hero] > *',
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, stagger: 0.1 },
        )
        .fromTo(
          '[data-landing-feature]',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12 },
          '-=0.25',
        )

      gsap.utils.toArray<HTMLElement>('[data-section-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          },
        )
      })
    }, page)

    return () => {
      observer.disconnect()
      heroObserver.disconnect()
      animation.revert()
    }
  }, [])

  return (
    <div ref={pageRef} className="space-y-20 py-6 sm:py-10">
      {/* HERO SECTION */}
      <section id="hero" data-landing-hero className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface via-surface/50 to-background px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-primary-rgb),0.08)_0,transparent_70%)] pointer-events-none" />
        <span className="relative inline-block rounded-full bg-primary-soft px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
          Flagship Karaoke Studio &amp; Music Production
        </span>
        <h1 className="relative mt-6 font-heading text-5xl leading-none font-bold tracking-wide uppercase sm:text-7xl">
          Sing your heart out
          <br />
          <span className="text-primary">with BTP Karaoke</span>
        </h1>
        <p className="relative mx-auto mt-6 max-w-2xl text-base text-text-secondary sm:text-lg">
          Browse master vault collections, queue your favorite tracks, and experience lossless minus-one
          backing tracks, professional recording, and FILSCAP musical assistance all in one unified studio.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => openAuth('signup')}
            className="rounded-xl bg-primary px-8 py-3.5 font-bold text-text-primary transition hover:bg-primary-hover shadow-lg shadow-primary/20"
          >
            Get Started Free
          </button>
          <button
            type="button"
            onClick={() => openAuth('signin')}
            className="rounded-xl border border-border bg-surface px-8 py-3.5 font-bold text-text-secondary transition hover:text-text-primary hover:border-primary/50"
          >
            Sign In to Studio
          </button>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Master Vault', desc: 'Lossless minus-one collections remastered from the BTP analogue archive.' },
            { title: 'Live Queue', desc: 'Request tracks, order rotation, and keep the stage moving.' },
            { title: 'Voice Tools', desc: 'Tune, edit, and preview your vocals before the real take.' },
          ].map((feature) => (
            <article
              key={feature.title}
              data-landing-feature
              className="rounded-xl border border-border/80 bg-surface/80 backdrop-blur p-6 text-left shadow-sm transition hover:border-primary/40"
            >
              <h2 className="font-heading text-lg font-semibold uppercase text-text-primary">{feature.title}</h2>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" data-section-reveal className="scroll-mt-24 space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <SectionEyebrow>Music Production · Recording · Artist Services</SectionEyebrow>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">
              Studio Services &amp; Rates
            </h2>
          </div>
          <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold tracking-widest text-text-secondary uppercase">
            FILSCAP-Accredited
          </span>
        </div>

        <div className="max-w-4xl">
          <p className="font-heading text-2xl leading-tight font-bold tracking-wide text-primary uppercase sm:text-3xl">
            Your Music, Our Passion, Your Success!
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base">
            BTP Music Production provides music production, recording, artist development, live
            entertainment, karaoke music video production, and online music services. We support
            singers, songwriters, composers, musicians, and independent artists in developing and
            promoting their music.
          </p>
        </div>

        {serviceGroups.map((group) => (
          <ServiceGroup key={group.id} group={group} />
        ))}

        <FilscapPanel />
        <SubscriptionPanel />
        <VipPanel />
        <ServicesCta />
      </section>

      {/* ABOUT SECTION */}
      <section id="about" data-section-reveal className="scroll-mt-24 space-y-12 border-t border-border pt-16">
        <div>
          <SectionEyebrow>Heritage &amp; Vision</SectionEyebrow>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            About BTP Music Production
          </h2>
        </div>

        <AboutHero />
        <StatsStrip />
        <WhatWeDo />
        <StoryVision />
        <Commitments />
        <AboutCta />
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" data-section-reveal className="scroll-mt-24 space-y-8 border-t border-border pt-16 text-center">
        <div>
          <div className="flex justify-center">
            <SectionEyebrow>Official Channels</SectionEyebrow>
          </div>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Get in Touch with BTP
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Connect with BTP Music Production directly via our official channels for inquiries, demos, licensing,
            and studio bookings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 text-left">
          {channels.map((channel) => (
            <article
              key={channel.title}
              className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition hover:border-primary/50"
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-xl bg-surface-elevated text-text-primary border border-border"
              >
                <HugeiconsIcon icon={channel.icon} size={22} />
              </span>
              <h3 className="mt-4 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
                {channel.title}
              </h3>
              <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">{channel.label}</p>
              <p className="mt-2 text-sm font-semibold break-words text-text-primary">{channel.value}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">{channel.desc}</p>
              <a
                href={channel.href}
                {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm font-semibold text-text-primary transition hover:border-primary/50 hover:text-primary"
              >
                {channel.action}
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
