import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, CrownIcon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'
import { vip } from '../data'

export default function VipPanel() {
  return (
    <section
      data-services-reveal
      className="mt-14 overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-lg bg-warning/10 text-warning"
          >
            <HugeiconsIcon icon={CrownIcon} size={22} />
          </span>
          <div className="mt-4">
            <SectionEyebrow>{vip.eyebrow}</SectionEyebrow>
            <h2 className="mt-2 font-heading text-2xl leading-tight font-bold tracking-wide uppercase">
              {vip.title}
            </h2>
          </div>

          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heading text-5xl leading-none font-bold tracking-wide text-warning">
              {vip.headline}
            </span>
            <span className="max-w-[12rem] text-xs font-semibold tracking-widest text-text-secondary uppercase">
              {vip.headlineSuffix}
            </span>
          </p>

          <p className="mt-5 text-sm leading-relaxed text-text-secondary">{vip.intro}</p>

          <div className="mt-5 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <p className="text-[10px] font-bold tracking-widest text-warning uppercase">
              {vip.benefitLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{vip.benefit}</p>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            Eligible services include
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {vip.eligible.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary"
              >
                <span aria-hidden="true" className="mt-0.5 shrink-0">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    className="text-warning"
                  />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-text-muted">
            {vip.terms}
          </p>
        </div>
      </div>
    </section>
  )
}
