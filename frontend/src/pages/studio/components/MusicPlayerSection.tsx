import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  DashboardSpeed01Icon,
  DiscAlbumIcon,
  HashtagIcon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import type { MediaItem } from '../../../lib/media-api'

export default function MusicPlayerSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="music-tracks-heading" className="space-y-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="flex items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={MusicNote01Icon} size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="music-tracks-heading" className="text-xl leading-tight font-bold font-sans">
              Music Tracks
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              High-bitrate studio audio masters &amp; instrumental arrangements
            </p>
          </div>
        </div>
        <Link
          to="/studio?filter=music"
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
        >
          Explore Library
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((track) => {
          const meta: MediaCardMeta[] = []
          if (track.album) meta.push({ icon: DiscAlbumIcon, text: track.album })
          if (track.tempo) meta.push({ icon: DashboardSpeed01Icon, text: track.tempo })
          if (track.songKey) meta.push({ icon: HashtagIcon, text: track.songKey })

          return (
            <MediaCard
              key={track.id}
              layout="row"
              tag={track.tag ?? 'MP3'}
              icon={MusicNote01Icon}
              title={track.title}
              subtitle={track.artist ?? track.subtitle ?? ''}
              meta={meta}
              duration={track.duration}
              coverUrl={track.coverUrl}
              to={track.sourceUrl ? '/studio/player-queue' : undefined}
              toState={track.sourceUrl ? { autoplay: true, item: track } : undefined}
              queue={{ mediaId: track.id, len: track.duration, src: track.sourceUrl, kind: 'music' }}
            />
          )
        })}
      </div>
    </section>
  )
}
