import {
  Clock01Icon,
  DashboardSpeed01Icon,
  DiscAlbumIcon,
  HashtagIcon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import type { MediaItem } from '../../../lib/media-api'

/**
 * Studio home — Section 2: the audio songs (minus-one sets), one media card
 * per published row of the admin-managed catalog. A track with an uploaded
 * MP3 opens the console and really plays it (the console doubles as a media
 * stage); rows without audio stay visual-only. Cards carry the row's cover
 * art (default art when it has none), its artist under the title, and its
 * runtime (read off the file), tempo, key and album in the meta strip.
 * Renders nothing while the section has no published tracks.
 */
export default function MusicPlayerSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-primary">◆</span>
        <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Music Player</h2>
        <span className="text-[10px] tracking-widest text-text-muted uppercase">Minus-One &amp; Backing Tracks</span>
        <span className="ml-auto text-xs text-primary">
          Viewing {items.length} of {items.length} tracks
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((track) => {
          const meta: MediaCardMeta[] = []
          // The clock always means runtime (a video card reads the same);
          // tempo gets the speedometer so the two never read alike.
          if (track.duration) meta.push({ icon: Clock01Icon, text: track.duration })
          if (track.tempo) meta.push({ icon: DashboardSpeed01Icon, text: track.tempo })
          if (track.songKey) meta.push({ icon: HashtagIcon, text: track.songKey })
          if (track.album) meta.push({ icon: DiscAlbumIcon, text: track.album })

          return (
            <MediaCard
              key={track.id}
              tag={track.tag ?? 'MIX'}
              icon={MusicNote01Icon}
              title={track.title}
              subtitle={track.artist ?? track.subtitle ?? ''}
              coverUrl={track.coverUrl}
              to={track.sourceUrl ? '/studio/player-queue' : undefined}
              toState={track.sourceUrl ? { autoplay: true, item: track } : undefined}
              meta={meta}
              queue={{ mediaId: track.id, len: track.duration, src: track.sourceUrl, kind: 'music' }}
            />
          )
        })}
      </div>
    </section>
  )
}
