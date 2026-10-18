import { Radio01Icon, SignalIcon } from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import { formatCount, type MediaItem } from '../../../lib/media-api'

/**
 * Studio home — Section 3: the live radio stations, one media card per
 * published row of the admin-managed catalog. Cards stay visual-only (no
 * stream selector yet). Renders nothing while the section has no published
 * stations.
 */
export default function RadioSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-primary">◆</span>
        <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Radio</h2>
        <span className="text-[10px] tracking-widest text-text-muted uppercase">Live Stations &amp; Streams</span>
        <span className="ml-auto text-xs text-primary">
          Viewing {items.length} of {items.length} stations
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((station) => {
          const meta: MediaCardMeta[] = []
          if (station.freq) meta.push({ icon: Radio01Icon, text: station.freq })
          if (station.listeners !== null) meta.push({ icon: SignalIcon, text: formatCount(station.listeners) })

          return (
            <MediaCard
              key={station.id}
              tag={station.tag ?? 'On Air'}
              icon={Radio01Icon}
              title={station.title}
              subtitle={station.subtitle ?? ''}
              meta={meta}
            />
          )
        })}
      </div>
    </section>
  )
}
