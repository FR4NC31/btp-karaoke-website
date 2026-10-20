import { HugeiconsIcon } from '@hugeicons/react'
import { commitments } from '../data'
import SectionHeader from './SectionHeader'

export default function Commitments() {
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="Guiding Principles" title="Our Core Commitments" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {commitments.map((item) => (
          <article key={item.title} data-about-reveal className="rounded-xl border border-border bg-surface p-6">
            <span aria-hidden="true">
              <HugeiconsIcon icon={item.icon} size={20} className="text-primary" />
            </span>
            <h3 className="mt-4 font-heading text-base font-bold tracking-wide uppercase">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
