import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Queue01Icon } from '@hugeicons/core-free-icons'
import type { QueueItem } from '../../lib/lounge-queue'
import QueueRow from './queue/QueueRow'

type LoungeQueueRailProps = {
  rows: QueueItem[]
  totalCount: number
  playingRowId: string | null
  shuffle: boolean
  onRemove: (id: string) => void
  onClear: () => void
  onMove: (from: number, to: number) => void
  onPlay: (id: string) => void
}

export default function LoungeQueueRail({
  rows,
  totalCount,
  playingRowId,
  shuffle,
  onRemove,
  onClear,
  onMove,
  onPlay,
}: LoungeQueueRailProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface px-3.5 py-3.5 lg:col-start-2 lg:row-start-1 lg:self-start">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
          <HugeiconsIcon icon={Queue01Icon} size={15} className="text-primary" />
          Upcoming Lounge Queue
        </h2>
        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-text-primary">
          {totalCount > 0 ? `+${totalCount} waiting` : 'Empty'}
        </span>
      </div>

      {totalCount === 0 ? (
        <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <HugeiconsIcon icon={Queue01Icon} size={22} className="text-text-muted" />
          <p className="mt-2 text-xs font-semibold">The lounge queue is empty</p>
          <p className="mt-1 max-w-56 text-[10px] leading-relaxed text-text-muted">
            Pick a song from the media hub to get started.
          </p>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted transition hover:text-error"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
            Clear All
          </button>
        </div>
      )}

      {totalCount > 0 && (
        <ul className="mt-3 space-y-2">
          {rows.map((row, index) => (
            <QueueRow
              key={row.id}
              row={row}
              index={index}
              playing={row.id === playingRowId}
              shuffle={shuffle}
              dragging={dragIndex === index}
              onDragStart={(event) => {
                setDragIndex(index)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', row.id)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                if (shuffle || dragIndex === null) return
                event.dataTransfer.dropEffect = 'move'
                if (dragIndex !== index) {
                  onMove(dragIndex, index)
                  setDragIndex(index)
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              onRemove={() => onRemove(row.id)}
              onPlay={() => onPlay(row.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
