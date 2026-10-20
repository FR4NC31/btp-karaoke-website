import {
  Clock01Icon,
  DashboardSpeed01Icon,
  DiscAlbumIcon,
  HashtagIcon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import MediaCarousel from '../../../components/MediaCarousel'
import type { MediaItem } from '../../../lib/media-api'

export default function MusicPlayerSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <MediaCarousel
        label="Music Player"
        header={
          <>
            <span className="text-primary">◆</span>
            <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Music Player</h2>
            <span className="text-[10px] tracking-widest text-text-muted uppercase">Minus-One &amp; Backing Tracks</span>
          </>
        }
        aside={
          <span className="text-xs text-primary">
            Viewing {items.length} of {items.length} tracks
          </span>
        }
      >
        {items.map((track) => {
          const meta: MediaCardMeta[] = []
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
      </MediaCarousel>
    </section>
  )
}
