import { HugeiconsIcon } from '@hugeicons/react'
import { services } from '../data'
import SectionHeader from './SectionHeader'

/** Capabilities & Services card grid. */
export default function WhatWeDo() {
  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="Capabilities & Services"
        title="What We Do"
        desc="Full-spectrum audio engineering, rights management, and digital karaoke solutions tailored for the Philippine music landscape."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <article key={service.title} data-about-reveal className="flex flex-col rounded-xl border border-border bg-surface p-6">
            <span aria-hidden="true">
              <HugeiconsIcon icon={service.icon} size={22} className="text-text-primary" />
            </span>
            <h3 className="mt-4 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
              {service.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{service.desc}</p>
            <p className="mt-4 text-xs font-bold tracking-widest text-primary uppercase">{service.label}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
