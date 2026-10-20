import { stats } from '../data'

/** The four-cell credential strip under the hero. */
export default function StatsStrip() {
  return (
    <section className="mt-14 border-y border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.value}
            data-about-reveal
            className={`px-5 py-8 sm:px-6 ${i >= 2 ? 'border-t border-border' : ''} ${
              i % 2 === 1 ? 'border-l border-border' : ''
            } lg:border-t-0 ${i > 0 ? 'lg:border-l lg:border-border' : ''}`}
          >
            <p className="font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">{stat.value}</p>
            <p className="mt-1.5 text-xs font-bold tracking-widest text-primary uppercase">{stat.label}</p>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">{stat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
