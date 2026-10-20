import { rateCards } from '../data'

export default function RateStrip() {
  return (
    <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {rateCards.map((card) => (
        <div key={card.label} data-services-reveal className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] font-bold tracking-widest text-text-muted uppercase">{card.label}</p>
          <p className="mt-2 font-heading text-xl leading-tight font-bold tracking-wide text-primary uppercase">
            {card.value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">{card.desc}</p>
        </div>
      ))}
    </section>
  )
}
