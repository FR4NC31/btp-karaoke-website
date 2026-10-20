import { Radio01Icon, SignalIcon } from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import MediaCarousel from '../../../components/MediaCarousel'
import { formatCount, type MediaItem } from '../../../lib/media-api'

export default function RadioSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <MediaCarousel
        label="Radio"
        header={
          <>
            <span className="text-primary">◆</span>
            <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Radio</h2>
            <span className="text-[10px] tracking-widest text-text-muted uppercase">Live Stations &amp; Streams</span>
          </>
        }
        aside={
          <span className="text-xs text-primary">
            Viewing {items.length} of {items.length} stations
          </span>
        }
      >
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
      </MediaCarousel>
    </section>
  )
}
