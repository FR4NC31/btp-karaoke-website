import { useId } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  HeadphonesIcon,
  PlayIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import type { MediaItem } from '../../../../lib/media-api'
import PlaylistMosaic from './PlaylistMosaic'
import { playlistDuration, type Playlist } from './mock-playlists'

export default function TrendingPlaylistCard({
  playlist,
  byTitle,
  onPlay,
}: {
  playlist: Playlist
  byTitle: Map<string, MediaItem>
  onPlay: (playlist: Playlist) => void
}) {
  const titleId = useId()
  const count = playlist.tracks.length
  const duration = playlistDuration(playlist.tracks)
  const isVideo = playlist.id === 'trending-video'

  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex gap-3 overflow-hidden rounded-xl border border-border bg-surface p-3 transition-[border-color,transform] duration-200 hover:border-primary/45 motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border sm:size-24">
        <PlaylistMosaic tracks={playlist.tracks} tone={playlist.tone} byTitle={byTitle} />
        <span className="absolute top-1.5 left-1.5 rounded border border-white/10 bg-black/60 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.14em] text-primary uppercase backdrop-blur">
          {isVideo ? 'Video' : 'Audio'}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.14em] text-primary uppercase">
          <HugeiconsIcon icon={isVideo ? Video01Icon : HeadphonesIcon} size={12} />
          Trending
        </p>
        <h3
          id={titleId}
          className="mt-1 line-clamp-1 font-heading text-lg leading-tight font-bold tracking-wide uppercase"
        >
          {playlist.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text-muted">
          {playlist.description}
        </p>
        <p className="mt-2 text-[9px] font-semibold tracking-[0.12em] text-text-muted uppercase">
          {count} {count === 1 ? 'song' : 'songs'} · {duration}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label={`Play ${playlist.name}`}
          onClick={() => onPlay(playlist)}
          disabled={count === 0}
          className="z-20 grid size-9 place-items-center rounded-full border border-border bg-surface-elevated text-text-primary transition hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={PlayIcon} size={15} />
        </button>
        <span className="grid size-8 place-items-center rounded-full border border-border text-text-muted transition group-hover:border-primary/50 group-hover:text-primary">
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
        </span>
      </div>

      <Link
        to={`/studio/playlists/${playlist.id}`}
        aria-label={`Open ${playlist.name}`}
        className="absolute inset-0 z-10 rounded-xl outline-primary/60 hover:outline-2 hover:-outline-offset-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
      />
    </article>
  )
}
