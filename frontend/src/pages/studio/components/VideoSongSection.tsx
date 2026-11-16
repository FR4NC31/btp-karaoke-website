import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon, Video01Icon } from '@hugeicons/core-free-icons'
import MediaCard from './MediaCard'
import { cn } from '../../../lib/utils'
import type { MediaItem } from '../../../lib/media-api'

export default function VideoSongSection({ items }: { items: MediaItem[] }) {
  const [genre, setGenre] = useState('All')

  if (items.length === 0) return null

  // Genre chips read the real per-song Album field — the schema has no genre column.
  const genres = [
    ...new Set(items.map((song) => song.album).filter((value): value is string => Boolean(value))),
  ]
  // A chip can outlive the items it came from (?q= narrows the list underneath).
  const active = genres.includes(genre) ? genre : 'All'
  const visible = active === 'All' ? items : items.filter((song) => song.album === active)

  return (
    <section aria-labelledby="video-songs-heading" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={Video01Icon} size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="video-songs-heading" className="text-xl leading-tight font-bold font-sans">
              Video Songs
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              High-definition KTV video masters with synchronized vocal lyrics.
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Video songs by genre"
          className="flex flex-wrap justify-end gap-1.5"
        >
          {['All', ...genres].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={active === value}
              onClick={() => setGenre(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                active === value
                  ? 'border-primary bg-primary text-text-primary'
                  : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-fill with a 27rem cap: wide screens get more, smaller items
          instead of three oversized columns. */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,27rem))]">
        {visible.map((song) => (
          <MediaCard
            key={song.id}
            tag={song.tag ?? 'KTV'}
            icon={PlayIcon}
            title={song.title}
            subtitle={song.artist ?? song.subtitle ?? ''}
            genre={song.album}
            coverUrl={song.coverUrl}
            duration={song.duration}
            to="/studio/player-queue"
            toState={{ autoplay: true, item: song }}
            queue={{ mediaId: song.id, len: song.duration, src: song.sourceUrl, kind: 'video' }}
          />
        ))}
      </div>
    </section>
  )
}
