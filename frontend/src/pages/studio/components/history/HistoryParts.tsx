import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Clock01Icon,
  Delete01Icon,
  HeartIcon,
  Mic01Icon,
  MusicNote01Icon,
  PlayIcon,
  Queue01Icon,
  Tick02Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import type { PreviewItem } from '../../../../components/console/types'
import type { KaraokeVideoApi } from '../../../../lib/karaoke-player'
import { useLoungeQueue } from '../../../../lib/lounge-queue'
import type { MediaItem } from '../../../../lib/media-api'
import { usePlaylistLibrary } from '../../../../lib/playlist-library'
import {
  filterHistory,
  isActivePlayback,
  relativePlayTime,
  resolveHistoryItem,
  type HistoryEntry,
  type HistoryFilter,
} from '../../../../lib/play-history'
import { cn } from '../../../../lib/utils'

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'KTV Video' },
  { id: 'music', label: 'MP3 Audio' },
]

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function HistoryToolbar({
  count,
  filter,
  onFilter,
  onClear,
  showViewAll = false,
}: {
  count: number
  filter: HistoryFilter
  onFilter: (filter: HistoryFilter) => void
  onClear: () => void
  showViewAll?: boolean
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <div
        role="group"
        aria-label="History filters"
        className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-elevated p-0.5"
      >
        {FILTERS.map((option) => {
          const active = filter === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(option.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                FOCUS_RING,
                active
                  ? 'bg-primary text-text-primary'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            autoFocus
            onClick={() => {
              onClear()
              setConfirming(false)
            }}
            className={cn(
              'rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-primary-hover',
              FOCUS_RING,
            )}
          >
            Confirm clear
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(
              'rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary',
              FOCUS_RING,
            )}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={count === 0}
          onClick={() => setConfirming(true)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40',
            FOCUS_RING,
          )}
        >
          <HugeiconsIcon icon={Delete01Icon} size={14} />
          Clear History
        </button>
      )}

      {showViewAll && (
        <Link
          to="/studio/history"
          className={cn(
            'flex items-center gap-1 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary',
            FOCUS_RING,
          )}
        >
          View Full History
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      )}
    </>
  )
}

/**
 * One listening-history row. Deliberately a `div`, not an `<article>`: these
 * render above the catalog on the hub, so article cards would steal the
 * `main article` first-match pin from The Reason's media card.
 */
export function HistoryCard({
  entry,
  item,
  active,
}: {
  entry: HistoryEntry
  item: PreviewItem
  active: boolean
}) {
  const navigate = useNavigate()
  const { add } = useLoungeQueue()
  const library = usePlaylistLibrary()
  const liked = library.isLiked({
    title: entry.title,
    artist: entry.artist,
    mediaId: entry.mediaId,
  })
  const [queued, setQueued] = useState(false)
  const queueTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (queueTimer.current !== null) window.clearTimeout(queueTimer.current)
    },
    [],
  )

  const addToQueue = () => {
    add({
      title: entry.title,
      artist: entry.artist,
      len: entry.duration ?? undefined,
      coverUrl: entry.coverUrl,
      src: item.sourceUrl,
      kind: entry.kind,
      mediaId: entry.mediaId,
    })
    setQueued(true)
    if (queueTimer.current !== null) window.clearTimeout(queueTimer.current)
    queueTimer.current = window.setTimeout(() => setQueued(false), 2000)
  }

  const toggleLike = () => {
    library.toggleLiked({
      title: entry.title,
      artist: entry.artist,
      duration: entry.duration ?? undefined,
      coverUrl: entry.coverUrl,
      sourceUrl: item.sourceUrl,
      mediaId: entry.mediaId,
      kind: entry.kind,
    })
  }

  const iconButton =
    'grid size-6 shrink-0 place-items-center rounded transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-surface transition',
        active
          ? 'border-primary ring-1 ring-primary'
          : 'border-border hover:-translate-y-0.5 hover:border-primary/50',
      )}
    >
      <div className="relative aspect-[16/10] shrink-0 bg-surface-elevated">
        {entry.coverUrl ? (
          <img
            src={entry.coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-text-muted">
            <HugeiconsIcon
              icon={entry.kind === 'video' ? Video01Icon : MusicNote01Icon}
              size={26}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40" />

        <span
          className={cn(
            'absolute top-2 left-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
            entry.kind === 'video'
              ? 'bg-primary text-text-primary'
              : 'border border-white/15 bg-black/70 text-text-primary',
          )}
        >
          <HugeiconsIcon
            icon={entry.kind === 'video' ? Video01Icon : MusicNote01Icon}
            size={10}
          />
          {entry.kind === 'video' ? 'KTV Video' : 'MP3 Audio'}
        </span>

        <span className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-text-primary">
          <HugeiconsIcon icon={Clock01Icon} size={10} />
          {relativePlayTime(entry.playedAt)}
        </span>

        {entry.duration && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
            {entry.duration}
          </span>
        )}

        <button
          type="button"
          aria-label={`Play ${entry.title} from history`}
          onClick={() => navigate('/studio/player-queue', { state: { autoplay: true, item } })}
          className={cn(
            'absolute right-2 bottom-2 grid size-8 place-items-center rounded-full text-text-primary transition hover:scale-105',
            FOCUS_RING,
            // The screenshot only shows the circle on the active card; reveal
            // it for every other card on hover/focus so it stays reachable.
            active
              ? 'bg-primary opacity-100'
              : 'bg-primary/90 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-primary',
          )}
        >
          <HugeiconsIcon icon={PlayIcon} size={15} />
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-[13px] leading-snug font-semibold text-text-primary">
          {entry.title}
        </p>
        <p className="truncate text-[11px] text-text-muted">{entry.artist}</p>
        <div className="mt-1 flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-[9px] font-bold tracking-widest text-text-muted uppercase">
            {entry.category ?? ''}
          </span>
          <button
            type="button"
            aria-label={`Like ${entry.title} from history`}
            aria-pressed={liked}
            onClick={toggleLike}
            title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            className={cn(
              iconButton,
              liked ? 'text-primary' : 'text-text-muted hover:text-text-primary',
            )}
          >
            <HugeiconsIcon
              icon={HeartIcon}
              size={14}
              className={liked ? 'fill-current' : undefined}
            />
          </button>
          <Link
            to="/studio/player-queue"
            state={{ item }}
            aria-label={`Rehearse ${entry.title} from history`}
            title="Rehearse"
            className={cn(iconButton, 'text-text-muted hover:text-text-primary')}
          >
            <HugeiconsIcon icon={Mic01Icon} size={14} />
          </Link>
          <button
            type="button"
            aria-label={`Queue ${entry.title} from history`}
            onClick={addToQueue}
            title={queued ? 'Added to queue' : 'Add to queue'}
            className={cn(
              iconButton,
              queued ? 'text-primary' : 'text-text-muted hover:text-text-primary',
            )}
          >
            <HugeiconsIcon icon={queued ? Tick02Icon : Queue01Icon} size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading / empty / no-match states plus the resolved card list, shared by
 * the hub strip and the full history page. `render` decides the layout
 * (carousel rail vs grid).
 */
export function HistoryBody({
  entries,
  filter,
  items,
  player,
  render,
}: {
  entries: HistoryEntry[] | null
  filter: HistoryFilter
  items: MediaItem[]
  player: KaraokeVideoApi
  render: (cards: ReactNode) => ReactNode
}) {
  if (entries === null) {
    return (
      <div role="status" className="flex gap-4 overflow-hidden">
        <span className="sr-only">Loading listening history</span>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-44 w-44 shrink-0 animate-pulse rounded-xl bg-surface-elevated/60"
          />
        ))}
      </div>
    )
  }

  const visible = filterHistory(entries, filter)

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-6">
        <HugeiconsIcon icon={Clock01Icon} size={20} className="shrink-0 text-text-muted" />
        <p className="text-xs leading-relaxed text-text-muted">
          Nothing here yet — every track you play in the studio shows up here with its
          artwork, artist and duration.
        </p>
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-4 text-xs text-text-muted">
        No {filter === 'video' ? 'KTV video' : 'MP3 audio'} plays in your history yet.
      </p>
    )
  }

  return render(
    visible.map((entry) => (
      <HistoryCard
        key={`${entry.id}:${entry.playedAt}`}
        entry={entry}
        item={resolveHistoryItem(entry, items)}
        active={isActivePlayback(player.onAir, entry)}
      />
    )),
  )
}
