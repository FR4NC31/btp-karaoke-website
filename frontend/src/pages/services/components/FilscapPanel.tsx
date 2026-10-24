import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, CheckmarkCircle02Icon, Shield01Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'
import { filscap } from '../data'

export default function FilscapPanel() {
  return (
    <section data-services-reveal className="mt-14 rounded-xl border border-primary/40 bg-primary-soft/25 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-lg bg-background/60 text-primary"
          >
            <HugeiconsIcon icon={Shield01Icon} size={22} />
          </span>
          <div className="mt-4">
            <SectionEyebrow>{filscap.eyebrow}</SectionEyebrow>
            <h2 className="mt-2 font-heading text-2xl leading-tight font-bold tracking-wide uppercase">
              {filscap.title}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{filscap.intro}</p>
        </div>

        <div className="w-full rounded-xl border border-border bg-background/70 p-5 sm:w-64">
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            {filscap.feeLabel}
          </p>
          <p className="mt-2 font-heading text-2xl leading-none font-bold tracking-wide text-primary">
            {filscap.fee}
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:text-primary"
          >
            Ask about assistance
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>
      </div>

      <div className="mt-7 border-t border-border/70 pt-6">
        <h3 className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
          {filscap.assistanceLabel}
        </h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {filscap.assistance.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary"
            >
              <span aria-hidden="true" className="mt-0.5 shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-xs leading-relaxed text-text-muted">
        <span className="font-bold text-warning">Important: </span>
        {filscap.disclaimer}
      </p>
    </section>
  )
}
