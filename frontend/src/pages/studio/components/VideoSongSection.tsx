import { Clock01Icon, PlayIcon, ViewIcon } from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import { formatCount, type MediaItem } from '../../../lib/media-api'

/**
 * Studio home — Section 1: the karaoke video songs, one media card per
 * published row of the admin-managed catalog (/admin/media). Every card opens
 * the player-queue console carrying its catalog row, so the console plays the
 * row's uploaded MP4 when it has one (and the bundled local master when it
 * does not); the first card's title is the page h1. Renders nothing while the
 * section has no published songs.
 */
export default function VideoSongSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-primary">◆</span>
        <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Video Song</h2>
        <span className="text-[10px] tracking-widest text-text-muted uppercase">Karaoke Video Mode</span>
        <span className="ml-auto text-xs text-primary">
          Viewing {items.length} of {items.length} videos
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((song, index) => {
          const meta: MediaCardMeta[] = []
          if (song.duration) meta.push({ icon: Clock01Icon, text: song.duration })
          if (song.plays !== null) meta.push({ icon: ViewIcon, text: formatCount(song.plays) })

          return (
            <MediaCard
              key={song.id}
              tag={song.tag ?? 'KTV'}
              icon={PlayIcon}
              title={song.title}
              subtitle={song.subtitle ?? ''}
              to="/studio/player-queue"
              toState={{ autoplay: true, item: song }}
              titleAs={index === 0 ? 'h1' : undefined}
              meta={meta}
            />
          )
        })}
      </div>
    </section>
  )
}
