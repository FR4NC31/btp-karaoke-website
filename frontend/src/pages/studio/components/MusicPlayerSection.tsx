import { Clock01Icon, HashtagIcon, MusicNote01Icon } from '@hugeicons/core-free-icons'
import MediaCard, { type MediaCardMeta } from './MediaCard'
import type { MediaItem } from '../../../lib/media-api'

/**
 * Studio home — Section 2: the audio songs (minus-one sets), one media card
 * per published row of the admin-managed catalog. Cards are visual-only for
 * now (the shell player always drives the one local master). Renders nothing
 * while the section has no published tracks.
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
          if (track.tempo) meta.push({ icon: Clock01Icon, text: track.tempo })
          if (track.songKey) meta.push({ icon: HashtagIcon, text: track.songKey })

          return (
            <MediaCard
              key={track.id}
              tag={track.tag ?? 'MIX'}
              icon={MusicNote01Icon}
              title={track.title}
              subtitle={track.subtitle ?? ''}
              meta={meta}
            />
          )
        })}
      </div>
    </section>
  )
}
