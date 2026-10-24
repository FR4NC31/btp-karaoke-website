import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, MusicNote02Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'
import { subscription } from '../data'

export default function SubscriptionPanel() {
  return (
    <section data-services-reveal className="mt-14">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <SectionEyebrow>{subscription.eyebrow}</SectionEyebrow>
          <h2 className="mt-2 font-heading text-2xl leading-none font-bold tracking-wide uppercase">
            {subscription.title}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-text-muted">{subscription.intro}</p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {subscription.plans.map((plan) => (
            <article
              key={plan.label}
              className="flex flex-col rounded-xl border border-border bg-surface p-5"
            >
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-lg bg-surface-elevated text-primary"
              >
                <HugeiconsIcon icon={MusicNote02Icon} size={18} />
              </span>
              <h3 className="mt-3 text-[11px] font-bold tracking-widest text-text-muted uppercase">
                {plan.label}
              </h3>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <span className="font-heading text-3xl leading-none font-bold tracking-wide text-primary">
                  {plan.price}
                </span>
                <span className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
                  {plan.unit}
                </span>
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            {subscription.benefitsLabel}
          </h3>
          <ul className="mt-4 space-y-3">
            {subscription.benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary"
              >
                <span aria-hidden="true" className="mt-0.5 shrink-0">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    className="text-primary"
                  />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-text-muted">{subscription.disclaimer}</p>
    </section>
  )
}
