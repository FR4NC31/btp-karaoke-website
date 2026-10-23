import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Delete02Icon,
  MoreHorizontalIcon,
  MusicNote02Icon,
  PlayIcon,
  Queue01Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import equalizerIcon from '../../../../assets/icons/equalizer.svg'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { cn } from '../../../../lib/utils'
import type { PlaylistTrack } from './mock-playlists'

function TrackCover({
  coverUrl,
  kind,
}: {
  coverUrl: string | null
  kind: PlaylistTrack['kind']
}) {
  const [failed, setFailed] = useState(false)

  if (!coverUrl || failed) {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface-elevated text-text-muted">
        <HugeiconsIcon icon={kind === 'video' ? Video01Icon : MusicNote02Icon} size={15} />
      </span>
    )
  }

  return (
    <img
      src={coverUrl}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-9 shrink-0 rounded-md border border-border object-cover"
    />
  )
}

function Equalizer() {
  return (
    <img
      src={equalizerIcon}
      alt=""
      aria-hidden="true"
      className="size-4 shrink-0 object-contain"
    />
  )
}

export default function PlaylistTrackRow({
  index,
  track,
  coverUrl,
  playing,
  canPlay,
  canQueue,
  canRemove,
  removing = false,
  removeNote,
  onPlay,
  onQueue,
  onRemove,
}: {
  index: number
  track: PlaylistTrack
  coverUrl: string | null
  playing: boolean
  canPlay: boolean
  canQueue: boolean
  canRemove: boolean
  removing?: boolean
  removeNote?: string
  onPlay: () => void
  onQueue: () => void
  onRemove: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <li
      className={cn(
        'group grid grid-cols-[2rem_minmax(0,1fr)_auto_4.5rem] items-center gap-3 border-b border-border/70 px-3 py-2.5 last:border-b-0 motion-safe:transition-[opacity,transform] motion-safe:duration-200 sm:grid-cols-[2rem_minmax(0,1.45fr)_minmax(0,1fr)_4.5rem_3.5rem_4.5rem]',
        playing ? 'bg-primary-soft/35' : 'hover:bg-surface-elevated/60',
        removing && 'pointer-events-none opacity-0 motion-safe:translate-x-2',
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        disabled={!canPlay}
        aria-label={playing ? `Now playing ${track.title}` : `Play ${track.title}`}
        className="grid size-8 place-items-center rounded text-[11px] font-semibold text-text-muted transition group-hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        {playing ? (
          <span className="flex items-center gap-1.5">
            <Equalizer />
            <span className="sr-only">Now playing</span>
          </span>
        ) : (
          <>
            <span className="group-hover:hidden">{index}</span>
            <HugeiconsIcon icon={PlayIcon} size={13} className="hidden group-hover:block" />
          </>
        )}
      </button>

      <div className="flex min-w-0 items-center gap-2.5">
        <TrackCover coverUrl={coverUrl} kind={track.kind} />
        <div className="min-w-0">
          <p className={cn('truncate text-[13px] font-semibold', playing && 'text-primary')}>
            {track.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-text-muted">{track.artist}</p>
        </div>
      </div>

      <p className="hidden truncate text-[11px] text-text-muted sm:block">{track.album || '—'}</p>

      <p className="hidden text-[10px] tracking-wide text-text-muted uppercase sm:block">
        {track.added}
      </p>

      <p
        className={cn(
          'text-right text-[10px] tabular-nums',
          playing ? 'text-primary' : 'text-text-muted',
        )}
      >
        {track.duration || '—'}
      </p>

      <div className="flex items-center justify-end gap-0.5">
        {canRemove ? (
          <button
            type="button"
            aria-label={`Remove ${track.title} from playlist`}
            title="Remove from playlist"
            onClick={onRemove}
            className="grid size-8 place-items-center rounded text-text-muted transition hover:bg-surface-elevated hover:text-error"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
          </button>
        ) : null}

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`More options for ${track.title}`}
              className="grid size-8 place-items-center rounded text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={15} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={6}
            collisionPadding={12}
            className="w-56 border border-border bg-surface p-1.5 text-text-primary shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onQueue()
              }}
              disabled={!canQueue}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              <HugeiconsIcon icon={Queue01Icon} size={15} />
              Add to queue
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onRemove()
              }}
              disabled={!canRemove}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-elevated hover:text-error disabled:cursor-not-allowed disabled:opacity-45"
            >
              <HugeiconsIcon icon={Delete02Icon} size={15} />
              Remove from playlist
            </button>
            <p className="mt-1 border-t border-border px-2.5 pt-2 pb-1 text-[10px] leading-relaxed text-text-muted">
              {canRemove
                ? 'Removing a song changes this set immediately.'
                : (removeNote ?? 'Liked Songs is managed by the heart button.')}
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </li>
  )
}
