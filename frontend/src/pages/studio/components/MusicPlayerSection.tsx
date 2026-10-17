import { Clock01Icon, HashtagIcon, MusicNote01Icon } from '@hugeicons/core-free-icons'
import { musicTracks } from '../data'
import MediaCard from './MediaCard'

/**
 * Studio home — Section 2: the audio songs (minus-one sets), one media card
 * per set in the collection-card mockup style.
 */
export default function MusicPlayerSection() {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-primary">◆</span>
        <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Music Player</h2>
        <span className="text-[10px] tracking-widest text-text-muted uppercase">Minus-One &amp; Backing Tracks</span>
        <span className="ml-auto text-xs text-primary">
          Viewing {musicTracks.length} of {musicTracks.length} tracks
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {musicTracks.map((track) => (
          <MediaCard
            key={track.title}
            tag={track.tag}
            icon={MusicNote01Icon}
            title={track.title}
            subtitle={track.subtitle}
            meta={[
              { icon: Clock01Icon, text: track.tempo },
              { icon: HashtagIcon, text: track.key },
            ]}
          />
        ))}
      </div>
    </section>
  )
}
