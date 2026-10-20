import { useState } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  PlusSignIcon,
  Queue01Icon,
} from '@hugeicons/core-free-icons'
import type { QueueItem } from '../../lib/lounge-queue'
import QueueAddForm from './queue/QueueAddForm'
import QueueRow from './queue/QueueRow'

type LoungeQueueRailProps = {
  /** Rows in display order — the stored queue, or its shuffled permutation. */
  rows: QueueItem[]
  /** Stored row count (header badge + disabled states). */
  totalCount: number
  playingRowId: string | null
  /** The bar's Shuffle is on: the order is derived, so drag-reorder pauses. */
  shuffle: boolean
  onAdd: (title: string, artist: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onMove: (from: number, to: number) => void
}

/**
 * Upcoming Lounge Queue — the console's right rail and the transport's
 * playlist. Add a custom track (header or empty state), remove a row, clear
 * all, or drag the grip handle to reorder — paused while the bar's Shuffle
 * shows a random order.
 */
export default function LoungeQueueRail({
  rows,
  totalCount,
  playingRowId,
  shuffle,
  onAdd,
  onRemove,
  onClear,
  onMove,
}: LoungeQueueRailProps) {
  const [addingTrack, setAddingTrack] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftArtist, setDraftArtist] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  function addTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title) return
    onAdd(title, draftArtist.trim())
    setDraftTitle('')
    setDraftArtist('')
    setAddingTrack(false)
  }

  function cancelAdd() {
    setAddingTrack(false)
    setDraftTitle('')
    setDraftArtist('')
  }

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

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={addingTrack || totalCount === 0}
          onClick={() => setAddingTrack((open) => !open)}
          disabled={totalCount === 0}
          className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-text-secondary uppercase transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={13} />
          Add Custom Track
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={totalCount === 0}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted transition hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={13} />
          Clear All
        </button>
      </div>

      {(totalCount === 0 || addingTrack) && (
        <QueueAddForm
          totalCount={totalCount}
          addingTrack={addingTrack}
          draftTitle={draftTitle}
          draftArtist={draftArtist}
          onDraftTitleChange={setDraftTitle}
          onDraftArtistChange={setDraftArtist}
          onSubmit={addTrack}
          onCancel={cancelAdd}
        />
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
                // Reordering edits the stored arrangement, so it is
                // paused while shuffle shows a derived order.
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
            />
          ))}
        </ul>
      )}
    </section>
  )
}
