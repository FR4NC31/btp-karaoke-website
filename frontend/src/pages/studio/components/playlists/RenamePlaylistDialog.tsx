import { useState } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit01Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { usePlaylistLibrary } from '../../../../lib/playlist-library'
import type { Playlist } from './mock-playlists'

type RenamePlaylistDialogProps = {
  playlist: Playlist
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RenamePlaylistDialog({
  playlist,
  open,
  onOpenChange,
}: RenamePlaylistDialogProps) {
  const { playlists, renamePlaylist } = usePlaylistLibrary()
  const [name, setName] = useState(playlist.name)
  const [error, setError] = useState('')
  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed !== playlist.name

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed) {
      setError('Enter a playlist name.')
      return
    }
    const duplicate = playlists.some(
      (row) =>
        row.id !== playlist.id && row.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      setError('A playlist with that name already exists.')
      return
    }
    renamePlaylist(playlist.id, trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border border-border bg-surface p-0 text-text-primary">
        <div className="flex items-start gap-3 border-b border-border px-5 pt-5 pb-4 pr-12">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary-soft text-primary">
            <HugeiconsIcon icon={PencilEdit01Icon} size={18} />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
              Rename playlist
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed text-text-muted">
              Give <span className="font-semibold text-text-secondary">{playlist.name}</span> a
              new name. Its songs stay in place.
            </DialogDescription>
          </div>
        </div>

        <form id="rename-playlist-form" onSubmit={submit} className="px-5 py-4">
          <label
            htmlFor="rename-playlist-name"
            className="mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase"
          >
            Playlist name
          </label>
          <input
            id="rename-playlist-name"
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
            maxLength={60}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'rename-playlist-error' : undefined}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          {error ? (
            <p id="rename-playlist-error" role="alert" className="mt-2 text-[11px] text-error">
              {error}
            </p>
          ) : null}
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-border bg-surface-elevated px-3.5 text-[11px] font-bold tracking-wider text-text-secondary uppercase transition hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="rename-playlist-form"
            disabled={!canSave}
            className="h-9 rounded-lg bg-primary px-3.5 text-[11px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            Save changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
