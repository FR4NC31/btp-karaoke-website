import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { Facebook01Icon, Mail01Icon, PhoneIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../components/SectionEyebrow'

interface Channel {
  icon: IconSvgElement
  title: string
  label: string
  value: string
  desc: string
  action: string
  actionIcon: IconSvgElement
  href: string
  external: boolean
}

const channels: Channel[] = [
  {
    icon: Facebook01Icon,
    title: 'Social Media',
    label: 'Facebook Page',
    value: 'BTP Music Production',
    desc: 'Official updates, new song announcements, minus-one catalog previews, and direct messenger inquiries.',
    action: 'Visit Our Page',
    actionIcon: ArrowRight01Icon,
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
    actionIcon: ArrowRight01Icon,
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
    actionIcon: PhoneIcon,
    href: 'tel:+639329736975',
    external: false,
  },
]

export default function Contact() {
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animation = gsap.context(() => {
      const entrance = gsap.timeline({
        defaults: { duration: 0.65, ease: 'power3.out' },
      })

      entrance
        .fromTo(
          '[data-contact-hero] > *',
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, stagger: 0.1 },
        )
        .fromTo(
          '[data-contact-card]',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12 },
          '-=0.25',
        )
    }, page)

    return () => animation.revert()
  }, [])

  return (
    <div ref={pageRef} className="py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-widest uppercase">
        <Link to="/" className="text-primary hover:text-primary-hover">
          Home
        </Link>
        <span className="text-text-muted"> / Contact Us</span>
      </nav>

      {/* Hero */}
      <section data-contact-hero className="mt-3 text-center">
        <div className="flex justify-center">
          <SectionEyebrow>Official Channels</SectionEyebrow>
        </div>
        <h1 className="mt-3 font-heading text-4xl leading-none font-bold tracking-wide uppercase sm:text-5xl">
          Direct Lines
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Connect with BTP Music Production directly via our official channels for inquiries, demos, licensing,
          and studio bookings.
        </p>
      </section>

      {/* Channels */}
      <section className="mt-7 grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <article
            key={channel.title}
            data-contact-card
            className="flex flex-col rounded-xl border border-border bg-surface px-5 py-4"
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-lg bg-surface-elevated text-text-primary"
            >
              <HugeiconsIcon icon={channel.icon} size={20} />
            </span>
            <h2 className="mt-3 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
              {channel.title}
            </h2>
            <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">{channel.label}</p>
            <p className="mt-2 text-sm font-semibold break-words text-text-primary">{channel.value}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{channel.desc}</p>
            <a
              href={channel.href}
              {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-primary/50 hover:text-primary"
            >
              {channel.action}
              <HugeiconsIcon icon={channel.actionIcon} size={15} />
            </a>
          </article>
        ))}
      </section>
    </div>
  )
}
