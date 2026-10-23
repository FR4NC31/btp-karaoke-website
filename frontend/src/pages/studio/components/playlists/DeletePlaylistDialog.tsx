import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../../components/ui/dialog'
import type { Playlist } from './mock-playlists'

export default function DeletePlaylistDialog({
  playlist,
  open,
  onOpenChange,
  onConfirm,
}: {
  playlist: Playlist
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const count = playlist.tracks.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border border-border bg-surface p-0 text-text-primary">
        <div className="flex items-start gap-3 border-b border-border px-5 pt-5 pb-4 pr-12">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-error/30 bg-error/10 text-error">
            <HugeiconsIcon icon={Delete02Icon} size={18} />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
              Delete playlist
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed text-text-muted">
              Remove <span className="font-semibold text-text-secondary">{playlist.name}</span>{' '}
              from this studio session? The songs stay in the media hub.
            </DialogDescription>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-[11px] text-text-muted">
            {count === 0
              ? 'This empty set will be removed from your library. This cannot be undone in this session.'
              : `This set holds ${count} ${count === 1 ? 'song' : 'songs'}. Deleting it cannot be undone in this session.`}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            autoFocus
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-border px-4 text-[11px] font-bold tracking-wider text-text-secondary uppercase transition hover:border-primary/40 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-error px-4 text-[11px] font-bold tracking-wider text-text-primary uppercase transition hover:opacity-90"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
            Delete playlist
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
