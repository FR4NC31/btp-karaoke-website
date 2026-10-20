import { Clock01Icon, PlayIcon, ViewIcon } from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import MediaCarousel from '../../../components/MediaCarousel'
import { formatCount, type MediaItem } from '../../../lib/media-api'

export default function VideoSongSection({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <MediaCarousel
        label="Video Song"
        header={
          <>
            <span className="text-primary">◆</span>
            <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Video Song</h2>
            <span className="text-[10px] tracking-widest text-text-muted uppercase">Karaoke Video Mode</span>
          </>
        }
        aside={
          <span className="text-xs text-primary">
            Viewing {items.length} of {items.length} videos
          </span>
        }
      >
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
              subtitle={song.artist ?? song.subtitle ?? ''}
              coverUrl={song.coverUrl}
              to="/studio/player-queue"
              toState={{ autoplay: true, item: song }}
              titleAs={index === 0 ? 'h1' : undefined}
              meta={meta}
              queue={{ mediaId: song.id, len: song.duration, src: song.sourceUrl, kind: 'video' }}
            />
          )
        })}
      </MediaCarousel>
    </section>
  )
}
