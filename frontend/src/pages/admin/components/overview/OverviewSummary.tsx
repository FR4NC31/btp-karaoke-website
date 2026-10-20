export type OverviewStat = {
  label: string
  value: number
  hint: string
}

/** The three summary cards under the overview header. */
export default function OverviewSummary({ stats }: { stats: OverviewStat[] }) {
  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            {stat.label}
          </h2>
          <p className="mt-2 font-heading text-3xl leading-none font-bold text-primary">
            {stat.value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">{stat.hint}</p>
        </article>
      ))}
    </section>
  )
}
