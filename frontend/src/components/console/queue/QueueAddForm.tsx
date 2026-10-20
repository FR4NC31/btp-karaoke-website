import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, Queue01Icon } from '@hugeicons/core-free-icons'

type QueueAddFormProps = {
  totalCount: number
  addingTrack: boolean
  draftTitle: string
  draftArtist: string
  onDraftTitleChange: (value: string) => void
  onDraftArtistChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

/** Empty-state prompt plus the hand-typed track form. */
export default function QueueAddForm({
  totalCount,
  addingTrack,
  draftTitle,
  draftArtist,
  onDraftTitleChange,
  onDraftArtistChange,
  onSubmit,
  onCancel,
}: QueueAddFormProps) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-3">
      {totalCount === 0 && (
        <div className="text-center">
          <HugeiconsIcon icon={Queue01Icon} size={20} className="mx-auto text-text-muted" />
          <p className="mt-2 text-xs font-semibold">The lounge queue is empty</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">
            Add the first song and keep the night moving.
          </p>
        </div>
      )}
      <form
        onSubmit={onSubmit}
        aria-label="Add a track to the queue"
        className={`space-y-2 ${totalCount === 0 ? 'mt-3' : ''}`}
      >
        <label className="block">
          <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">Song title</span>
          <input
            required
            value={draftTitle}
            onChange={(event) => onDraftTitleChange(event.target.value)}
            placeholder="e.g. Beautiful Things"
            className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
            Artist (optional)
          </span>
          <input
            value={draftArtist}
            onChange={(event) => onDraftArtistChange(event.target.value)}
            placeholder="e.g. Benson Boone"
            className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-text-primary transition hover:bg-primary-hover"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={12} />
            Add to queue
          </button>
          {addingTrack && totalCount > 0 && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[10px] font-semibold text-text-muted transition hover:text-text-primary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
