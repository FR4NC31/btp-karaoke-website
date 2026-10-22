import { useState } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Playlist01Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../../components/ui/dialog'
import {
  PLAYLIST_GENRES,
  type NewPlaylistInput,
  type PlaylistGenre,
} from './mock-playlists'

type CreatePlaylistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: NewPlaylistInput) => void
}

export default function CreatePlaylistDialog({
  open,
  onOpenChange,
  onCreate,
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState<PlaylistGenre>('OPM')
  const canCreate = name.trim().length > 0

  function reset() {
    setName('')
    setDescription('')
    setGenre('OPM')
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canCreate) return
    onCreate({ name: name.trim(), description: description.trim(), genre })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 border border-border bg-surface p-0 text-text-primary">
        <div className="border-b border-border px-5 pt-5 pb-4 pr-12">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <HugeiconsIcon icon={Playlist01Icon} size={18} />
            </span>
            <div>
              <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
                New playlist
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-text-muted">
                Start a new setlist for the lounge.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form id="new-playlist-form" onSubmit={submit} className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="new-playlist-name"
              className="mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase"
            >
              Playlist name
            </label>
            <input
              id="new-playlist-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="e.g. Friday Night OPM"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-playlist-description"
              className="mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase"
            >
              Description
            </label>
            <textarea
              id="new-playlist-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={180}
              rows={3}
              placeholder="What is this set for?"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-playlist-genre"
              className="mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase"
            >
              Genre
            </label>
            <select
              id="new-playlist-genre"
              value={genre}
              onChange={(event) => setGenre(event.target.value as PlaylistGenre)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {PLAYLIST_GENRES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="h-9 rounded-lg border border-border bg-surface-elevated px-3.5 text-[11px] font-bold tracking-wider text-text-secondary uppercase transition hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-playlist-form"
            disabled={!canCreate}
            className="h-9 rounded-lg bg-primary px-3.5 text-[11px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            Create playlist
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
