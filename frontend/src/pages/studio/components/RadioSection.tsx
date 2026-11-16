import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BellIcon, Radio01Icon, SignalIcon } from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import { cn } from '../../../lib/utils'
import { formatCount, type MediaItem } from '../../../lib/media-api'

export default function RadioSection({ items }: { items: MediaItem[] }) {
  // Status is derived from what the studio actually published — no fake live flag.
  const live = items.some((station) => (station.tag ?? 'On Air').toLowerCase().includes('on air'))
  const [notify, setNotify] = useState(false)

  return (
    <section
      id="radio"
      aria-labelledby="radio-station-heading"
      className="flex flex-col rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-2">
        <h2
          id="radio-station-heading"
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[10px] font-bold tracking-widest text-text-secondary uppercase"
        >
          <HugeiconsIcon icon={Radio01Icon} size={12} className="text-primary" />
          BTP Studio Radio
        </h2>
        <span className="ml-auto text-[11px] text-text-muted">
          {items.length} {items.length === 1 ? 'Station' : 'Stations'} Live
        </span>
      </div>

      {/* Headline must not contain "Radio": KARAOKE-005 pins the h2 chip as the
          only heading matching that name. */}
      <h3 className="mt-4 text-lg font-bold font-sans text-text-primary">
        {live ? 'Producer Showcases On Air Now' : 'No Live Broadcasts Currently Active'}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
        {live
          ? `${items.length} published station${items.length === 1 ? '' : 's'} streaming BTP sessions, OPM sets and studio takeovers.`
          : 'BTP Studio Radio streams scheduled live producer showcases and acoustic sessions. Enable alerts when the next booth goes live.'}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          aria-pressed={notify}
          onClick={() => setNotify((value) => !value)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            notify
              ? 'border border-primary/50 bg-primary-soft text-primary'
              : 'bg-primary-soft bg-gradient-to-r from-primary to-primary-hover text-text-primary hover:brightness-110',
          )}
        >
          <HugeiconsIcon icon={BellIcon} size={14} />
          {notify ? 'Alerts On' : 'Notify Me When Live'}
        </button>
        {/* shortcut: there is no radio hub route yet */}
        <span
          aria-disabled="true"
          title="Coming soon"
          className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-text-muted/60"
        >
          Details
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {items.map((station) => {
            const meta: MediaCardMeta[] = []
            if (station.freq) meta.push({ icon: Radio01Icon, text: station.freq })
            if (station.listeners !== null)
              meta.push({ icon: SignalIcon, text: formatCount(station.listeners) })

            return (
              <MediaCard
                key={station.id}
                layout="row"
                tag={station.tag ?? 'On Air'}
                icon={Radio01Icon}
                title={station.title}
                subtitle={station.subtitle ?? ''}
                meta={meta}
                duration={station.duration}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
