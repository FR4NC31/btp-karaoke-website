import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { playlistDuration, type Playlist } from './mock-playlists'

export default function LikedSongsStrip({
  playlist,
  onPlay,
}: {
  playlist: Playlist
  onPlay: (playlist: Playlist) => void
}) {
  const count = playlist.tracks.length

  return (
    <section
      aria-labelledby="liked-songs-heading"
      className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
        <HugeiconsIcon icon={FavouriteIcon} size={25} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold tracking-[0.14em] text-primary uppercase">
          System playlist
        </p>
        <h2 id="liked-songs-heading" className="mt-0.5 font-heading text-xl font-bold tracking-wide uppercase">
          <Link
            to={`/studio/playlists/${playlist.id}`}
            className="transition hover:text-primary"
          >
            {playlist.name}
          </Link>
        </h2>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.1em] text-text-muted uppercase">
          {count} {count === 1 ? 'song' : 'songs'} · {playlistDuration(playlist.tracks)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Play ${playlist.name}`}
          onClick={() => onPlay(playlist)}
          disabled={count === 0}
          className="grid size-10 place-items-center rounded-full border border-border bg-surface-elevated text-text-primary transition hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={PlayIcon} size={17} />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`More options for ${playlist.name}`}
              className="grid size-10 place-items-center rounded-full border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={17} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            aria-label={playlist.name}
            className="w-60 border border-border bg-surface p-1.5 text-text-primary shadow-2xl"
          >
            <Link
              to={`/studio/playlists/${playlist.id}`}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
              Open Liked Songs
            </Link>
            <p className="mt-1 border-t border-border px-2.5 pt-2.5 pb-1 text-[10px] leading-relaxed text-text-muted">
              This system playlist fills automatically from the heart button.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  )
}
