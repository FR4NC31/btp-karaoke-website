import { Radio01Icon, SignalIcon } from '@hugeicons/core-free-icons'
import { radioStations } from '../data'
import MediaCard from './MediaCard'

/**
 * Studio home — Section 3: the live radio stations, one media card per
 * station in the collection-card mockup style.
 */
export default function RadioSection() {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-primary">◆</span>
        <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Radio</h2>
        <span className="text-[10px] tracking-widest text-text-muted uppercase">Live Stations &amp; Streams</span>
        <span className="ml-auto text-xs text-primary">
          Viewing {radioStations.length} of {radioStations.length} stations
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {radioStations.map((station) => (
          <MediaCard
            key={station.name}
            tag="On Air"
            icon={Radio01Icon}
            title={station.name}
            subtitle={station.genre}
            meta={[
              { icon: Radio01Icon, text: station.freq },
              { icon: SignalIcon, text: station.listeners },
            ]}
          />
        ))}
      </div>
    </section>
  )
}
