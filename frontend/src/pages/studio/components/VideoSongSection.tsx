import { Clock01Icon, PlayIcon, ViewIcon } from '@hugeicons/core-free-icons'
import { videoSongs } from '../data'
import MediaCard from './MediaCard'

/**
 * Studio home — Section 1: the karaoke video songs, one media card per song
 * in the same style as the Music Player / Radio sets. Every card opens the
 * player-queue console, which drives the one local video master through the
 * shell player bar; the first card's title is the page h1.
 */
export default function VideoSongSection() {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-primary">◆</span>
        <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Video Song</h2>
        <span className="text-[10px] tracking-widest text-text-muted uppercase">Karaoke Video Mode</span>
        <span className="ml-auto text-xs text-primary">
          Viewing {videoSongs.length} of {videoSongs.length} videos
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {videoSongs.map((song, index) => (
          <MediaCard
            key={song.title}
            tag={song.tag}
            icon={PlayIcon}
            title={song.title}
            subtitle={song.subtitle}
            to="/studio/player-queue"
            toState={{ autoplay: true }}
            titleAs={index === 0 ? 'h1' : undefined}
            meta={[
              { icon: Clock01Icon, text: song.duration },
              { icon: ViewIcon, text: song.plays },
            ]}
          />
        ))}
      </div>
    </section>
  )
}
