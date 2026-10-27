import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

export type OverviewStat = {
  label: string
  value: string
  trend: {
    label: string
    value: string
    color: 'success' | 'warning' | 'text-muted'
  }
  detail: string
  icon: IconSvgElement
  link: {
    label: string
    to: string
  }
}

const TREND_STYLES: Record<OverviewStat['trend']['color'], string> = {
  success: 'text-success',
  warning: 'text-warning',
  'text-muted': 'text-text-muted',
}

const ICON_STYLES: Record<OverviewStat['trend']['color'], string> = {
  success: 'text-success',
  warning: 'text-warning',
  'text-muted': 'text-text-muted',
}

/**
 * The four KPI cards. Values are derived from the reservation snapshot by
 * AdminOverview — the layout mirrors the studio dashboard concept: icon +
 * label, oversized value, trend, and a footer link into the desk.
 */
export default function OverviewSummary({ stats }: { stats: OverviewStat[] }) {
  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="flex flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-border/80"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated ${
                ICON_STYLES[stat.trend.color]
              }`}
            >
              <HugeiconsIcon icon={stat.icon} size={16} />
            </span>
            <h2 className="text-[10px] font-bold tracking-[0.14em] text-text-secondary uppercase">
              {stat.label}
            </h2>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="font-heading text-4xl leading-none font-bold text-text-primary">
              {stat.value}
            </p>
            <div className="text-right">
              <p
                className={`flex items-center justify-end gap-0.5 text-xs font-bold ${TREND_STYLES[stat.trend.color]}`}
              >
                {stat.trend.value.startsWith('+') ? <span className="text-[8px]">▲</span> : null}
                {stat.trend.value}
              </p>
              <p className="mt-0.5 text-[9px] tracking-widest text-text-muted uppercase">
                {stat.trend.label}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-text-muted">
              <span className="size-1.5 shrink-0 rounded-full bg-text-muted/60" />
              <span className="truncate">{stat.detail}</span>
            </p>
            <Link
              to={stat.link.to}
              className="shrink-0 text-[10px] font-bold tracking-widest text-text-secondary uppercase transition hover:text-primary"
            >
              {stat.link.label}
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}
