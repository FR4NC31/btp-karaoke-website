
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BellIcon,
  MusicNote01Icon,
  Radio01Icon,
  SignalIcon,
} from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'

import { formatCount, type MediaItem } from '../../../lib/media-api'

export default function RadioTab({ items }: { items: MediaItem[] }) {
  return (
    <section aria-labelledby="radio-tab-heading" className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Radio01Icon} size={20} className="text-primary" />
          <h2 id="radio-tab-heading" className="text-xl leading-none font-bold font-sans">
            BTP Studio Radio
          </h2>
        </div>
        <p className="mt-1.5 text-sm text-text-muted">
          Live producer showcases, acoustic sessions, and curated studio streams.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
            <HugeiconsIcon icon={Radio01Icon} size={30} />
          </span>

          <span className="mt-6 rounded-full border border-border px-3 py-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">
            0 Active Stations • Off Air
          </span>

          <h3 className="mt-4 text-2xl font-bold text-text-primary">
            BTP Studio Radio is Preparing to Broadcast
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            No live radio stations are currently broadcasting from the BTP Media Hub.
            <br />
            Subscribe below to receive an instant notification when our live booth goes on air,
            <br />
            or explore our on-demand studio tracks.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled
              title="Notifications coming soon"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-text-muted opacity-60"
            >
              <HugeiconsIcon icon={BellIcon} size={16} />
              Notify Me When Live (Soon)
            </button>
            <Link
              to="/studio?filter=music"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-text-primary transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <HugeiconsIcon icon={MusicNote01Icon} size={16} className="text-primary" />
              Browse Music Library
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
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
