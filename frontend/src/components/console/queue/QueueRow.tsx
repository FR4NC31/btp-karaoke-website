import type { DragEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, GripVerticalIcon } from '@hugeicons/core-free-icons'
import placeholderAlbum from '../../../assets/placeholder-album.svg'
import type { QueueItem } from '../../../lib/lounge-queue'

type QueueRowProps = {
  row: QueueItem
  index: number
  playing: boolean
  /** The bar's Shuffle is on: drag-reorder is paused. */
  shuffle: boolean
  dragging: boolean
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void
  onDragOver: (event: DragEvent<HTMLLIElement>) => void
  onDrop: (event: DragEvent<HTMLLIElement>) => void
  onDragEnd: () => void
  onRemove: () => void
}

/** One queue row: grip, position, cover, title/meta/tags + remove. */
export default function QueueRow({
  row,
  index,
  playing,
  shuffle,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: QueueRowProps) {
  const meta = [row.artist, row.genre].filter(Boolean).join(' · ')

  return (
    <li
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition ${
        playing
          ? 'border-primary/60 bg-primary-soft/15'
          : 'border-border/60 bg-surface-elevated/40'
      } ${dragging ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        draggable={!shuffle}
        aria-label={`Reorder ${row.title}`}
        aria-disabled={shuffle || undefined}
        title={shuffle ? 'Shuffle is on — turn it off to reorder' : 'Drag to reorder'}
        onDragStart={shuffle ? undefined : onDragStart}
        className={`grid size-6 shrink-0 place-items-center rounded-md text-text-muted transition ${
          shuffle
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-grab hover:bg-surface-elevated hover:text-text-primary active:cursor-grabbing'
        }`}
      >
        <HugeiconsIcon icon={GripVerticalIcon} size={13} />
      </button>
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-soft text-[9px] font-bold text-primary tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <img src={row.coverUrl ?? placeholderAlbum} alt="" className="size-9 shrink-0 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{row.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {meta && (
            <p className="truncate text-[9px] text-text-muted">
              {meta}
              {row.len ? ` (${row.len})` : ''}
            </p>
          )}
          {row.tags.map((tag) => (
            <span
              key={tag.label}
              className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] tracking-wide uppercase ${
                tag.solid
                  ? 'bg-primary font-bold text-text-primary'
                  : 'border border-border font-semibold text-text-secondary'
              }`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${row.title}`}
          className="grid size-6 place-items-center rounded-md text-text-muted transition hover:bg-surface-elevated hover:text-error"
        >
          <HugeiconsIcon icon={Delete02Icon} size={13} />
        </button>
      </div>
    </li>
  )
}
