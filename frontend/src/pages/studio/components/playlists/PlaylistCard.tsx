import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PlayIcon,
  Playlist01Icon,
} from '@hugeicons/core-free-icons'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { cn } from '../../../../lib/utils'
import type { MediaItem } from '../../../../lib/media-api'
import PlaylistMosaic from './PlaylistMosaic'
import { playlistDuration, type Playlist } from './mock-playlists'

type PlaylistCardProps = {
  playlist: Playlist
  byTitle: Map<string, MediaItem>
  onPlay: (playlist: Playlist) => void
  onRequestRename: (playlist: Playlist) => void
  onRequestDelete: (playlist: Playlist) => void
  removing?: boolean
}

function MenuRow({
  children,
  disabled,
  destructive,
  onClick,
  to,
}: {
  children: ReactNode
  disabled?: boolean
  destructive?: boolean
  onClick?: () => void
  to?: string
}) {
  const className = cn(
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-semibold transition',
    disabled
      ? 'cursor-not-allowed text-text-muted opacity-55'
      : destructive
        ? 'text-text-muted hover:bg-error/10 hover:text-error'
        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}

export default function PlaylistCard({
  playlist,
  byTitle,
  onPlay,
  onRequestRename,
  onRequestDelete,
  removing = false,
}: PlaylistCardProps) {
  const titleId = useId()
  const menuTitleId = useId()
  const menuDescriptionId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const count = playlist.tracks.length
  const duration = playlistDuration(playlist.tracks)
  const empty = count === 0

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-[border-color,opacity,transform] duration-200 hover:border-primary/45 motion-safe:hover:-translate-y-0.5',
        removing &&
          'pointer-events-none opacity-0 motion-safe:-translate-y-1 motion-safe:scale-[0.98]',
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-elevated">
        <div aria-hidden="true" className="pt-[100%]" />
        <PlaylistMosaic
          tracks={playlist.tracks}
          tone={playlist.tone}
          byTitle={byTitle}
          className="absolute inset-0"
        />
        <span className="pointer-events-none absolute top-3 left-3 z-10 rounded border border-white/10 bg-black/55 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-primary uppercase backdrop-blur">
          Playlist
        </span>

        <Link
          to={`/studio/playlists/${playlist.id}`}
          aria-label={`Open ${playlist.name}`}
          className="absolute inset-0 z-10 rounded-t-xl outline-primary/60 hover:outline-2 hover:-outline-offset-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
        />

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`More options for ${playlist.name}`}
              className="absolute top-2.5 right-2.5 z-20 grid size-8 place-items-center rounded-full border border-white/10 bg-black/55 text-text-secondary backdrop-blur transition hover:border-primary/50 hover:text-text-primary"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={15} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            aria-labelledby={menuTitleId}
            aria-describedby={menuDescriptionId}
            className="w-56 border border-border bg-surface p-1.5 text-text-primary shadow-2xl"
          >
            <div className="border-b border-border px-2.5 pt-1.5 pb-2.5">
              <p
                id={menuTitleId}
                className="truncate font-heading text-sm font-bold tracking-wide uppercase"
              >
                {playlist.name}
              </p>
              <p id={menuDescriptionId} className="mt-0.5 text-[10px] text-text-muted">
                {count} {count === 1 ? 'song' : 'songs'}
                {empty ? ' · empty playlist' : ` · ${duration}`}
              </p>
            </div>
            <div className="pt-1.5">
              <MenuRow
                onClick={() => {
                  setMenuOpen(false)
                  onPlay(playlist)
                }}
                disabled={empty}
              >
                <HugeiconsIcon icon={PlayIcon} size={15} />
                Play playlist
              </MenuRow>
              <MenuRow to={`/studio/playlists/${playlist.id}`}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                Open playlist
              </MenuRow>
              <div className="my-1.5 h-px bg-border" />
              <MenuRow
                onClick={() => {
                  setMenuOpen(false)
                  onRequestRename(playlist)
                }}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={15} />
                Rename playlist
              </MenuRow>
              <MenuRow
                destructive
                onClick={() => {
                  setMenuOpen(false)
                  onRequestDelete(playlist)
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={15} />
                Delete playlist
              </MenuRow>
            </div>
          </PopoverContent>
        </Popover>

        {empty ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 bottom-3 z-10 grid size-10 place-items-center rounded-full border border-white/10 bg-black/40 text-text-muted backdrop-blur"
          >
            <HugeiconsIcon icon={Playlist01Icon} size={17} />
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Play ${playlist.name}`}
            onClick={() => onPlay(playlist)}
            className="absolute right-3 bottom-3 z-20 grid size-10 place-items-center rounded-full border border-white/15 bg-black/55 text-text-primary backdrop-blur transition hover:border-primary hover:bg-primary hover:text-white"
          >
            <HugeiconsIcon icon={PlayIcon} size={17} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
        <Link
          id={titleId}
          to={`/studio/playlists/${playlist.id}`}
          tabIndex={-1}
          className="line-clamp-2 font-heading text-lg leading-tight font-bold tracking-wide uppercase transition hover:text-primary"
        >
          {playlist.name}
        </Link>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.1em] text-text-muted uppercase">
          {count} {count === 1 ? 'song' : 'songs'}
          {empty ? ' · empty playlist' : ` · ${duration}`}
        </p>
        <p className="mt-auto pt-2 text-[9px] font-semibold tracking-[0.12em] text-text-muted uppercase">
          Updated {playlist.updated}
        </p>
      </div>
    </article>
  )
}
