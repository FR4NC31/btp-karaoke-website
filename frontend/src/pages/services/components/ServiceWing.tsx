import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'
import type { Wing } from '../data'

export default function ServiceWing({ wing }: { wing: Wing }) {
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="mt-1">
            <HugeiconsIcon icon={wing.icon} size={24} className="text-text-primary" />
          </span>
          <div>
            <h2 className="font-heading text-2xl leading-none font-bold tracking-wide uppercase">
              {wing.name}
            </h2>
            <SectionEyebrow>{wing.eyebrow}</SectionEyebrow>
          </div>
        </div>
        <p className="max-w-md text-right text-sm leading-relaxed text-text-muted">{wing.desc}</p>
      </div>

      <div className={`mt-8 grid gap-4 ${wing.cols}`}>
        {wing.cards.map((card) => (
          <div
            key={card.tag}
            data-services-reveal
            className="flex flex-col rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold tracking-widest text-text-primary uppercase">{card.tag}</p>
              <p className="rounded-md border border-border bg-background px-2.5 py-1 text-[10px] font-semibold tracking-widest text-text-secondary uppercase">
                {card.badge}
              </p>
            </div>
            <h3 className="mt-4 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{card.desc}</p>
            <ul className="mt-5 space-y-2.5 rounded-lg bg-background p-4">
              {card.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
                  <span aria-hidden="true" className="mt-0.5 shrink-0">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {wing.aside && (
          <aside data-services-reveal className="rounded-xl border border-primary/40 bg-primary-soft/40 p-6">
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">{wing.aside.badge}</p>
            <h3 className="mt-2 font-heading text-lg font-bold tracking-wide uppercase">{wing.aside.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{wing.aside.intro}</p>
            {wing.aside.groups.map((group) => (
              <p key={group.label} className="mt-4 text-sm leading-relaxed text-text-secondary">
                <span className="font-semibold text-text-primary">{group.label}:</span> {group.text}
              </p>
            ))}
            <p className="mt-6 text-xs font-bold tracking-widest text-text-primary uppercase">
              {wing.aside.cta} →
            </p>
          </aside>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wing.footers.map((footer) => (
          <div key={footer.unit} className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">{footer.unit}</p>
            <p className="text-xs font-bold tracking-widest text-text-primary uppercase">
              {footer.action} <span aria-hidden="true">→</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
