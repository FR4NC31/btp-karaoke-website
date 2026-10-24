import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'
import type { ServiceGroupData } from '../data'

export default function ServiceGroup({ group }: { group: ServiceGroupData }) {
  return (
    <section id={group.id} className="mt-14 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <SectionEyebrow>{group.eyebrow}</SectionEyebrow>
          <h2 className="mt-2 font-heading text-2xl leading-none font-bold tracking-wide uppercase">
            {group.title}
          </h2>
        </div>
        {group.intro ? (
          <p className="max-w-md text-sm leading-relaxed text-text-muted">{group.intro}</p>
        ) : null}
      </div>

      <div className={`mt-8 grid gap-4 ${group.columns}`}>
        {group.cards.map((card) => (
          <article
            key={card.title}
            data-services-reveal
            className="flex flex-col rounded-xl border border-border bg-surface p-6"
          >
            <h3 className="font-heading text-lg leading-tight font-bold tracking-wide uppercase">
              {card.title}
            </h3>
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-border pt-4">
              <span className="font-heading text-2xl leading-none font-bold tracking-wide text-primary">
                {card.price}
              </span>
              <span className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
                {card.unit}
              </span>
            </p>
          </article>
        ))}
      </div>

      {group.note ? (
        <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-text-muted">
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-warning" />
          </span>
          {group.note}
        </p>
      ) : null}
    </section>
  )
}
