import { useState } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InformationCircleIcon,
  MusicNote02Icon,
  PlusSignIcon,
  Tick02Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { cn } from '../../../../lib/utils'
import { usePlaylistLibrary } from '../../../../lib/playlist-library'
import { sameTrack, type PlaylistTrack } from './mock-playlists'

type AddToPlaylistSong = Pick<
  PlaylistTrack,
  'title' | 'artist' | 'duration' | 'coverUrl' | 'sourceUrl' | 'mediaId' | 'kind'
> & {
  album?: string
}

type AddToPlaylistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: AddToPlaylistSong
}

function summarizeNames(names: string[]): string {
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

function SongThumb({ song }: { song: AddToPlaylistSong }) {
  const [failed, setFailed] = useState(false)

  if (song.coverUrl && !failed) {
    return (
      <img
        src={song.coverUrl}
        alt=""
        onError={() => setFailed(true)}
        className="size-11 shrink-0 rounded-md bg-surface-elevated object-cover"
      />
    )
  }

  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-elevated text-text-muted">
      <HugeiconsIcon icon={song.kind === 'video' ? Video01Icon : MusicNote02Icon} size={19} />
    </span>
  )
}

export default function AddToPlaylistDialog({
  open,
  onOpenChange,
  song,
}: AddToPlaylistDialogProps) {
  const { userPlaylists, addTrack, createPlaylist } = usePlaylistLibrary()
  const [newName, setNewName] = useState('')
  const alreadyIn = userPlaylists.filter((playlist) =>
    playlist.tracks.some((track) => sameTrack(track, song)),
  )

  function handleOpenChange(next: boolean) {
    if (!next) setNewName('')
    onOpenChange(next)
  }

  function add(playlistId: string) {
    addTrack(playlistId, song)
  }

  function createAndAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newName.trim()
    if (!name) return
    const created = createPlaylist({ name, description: '', genre: 'OPM' })
    addTrack(created.id, song)
    setNewName('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 border border-border bg-surface p-0 text-text-primary">
        <div className="flex items-center gap-3 border-b border-border px-5 pt-5 pb-4 pr-12">
          <SongThumb song={song} />
          <div className="min-w-0">
            <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
              Add to playlist
            </DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-xs text-text-muted">
              Choose a set for {song.title} by {song.artist}.
            </DialogDescription>
          </div>
        </div>

        {alreadyIn.length > 0 ? (
          <div
            role="status"
            className="mx-3 mt-3 flex gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5"
          >
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={15}
              className="mt-0.5 shrink-0 text-warning"
            />
            <p className="text-[11px] leading-relaxed text-text-secondary">
              <span className="font-semibold text-warning">
                Already added to {alreadyIn.length}{' '}
                {alreadyIn.length === 1 ? 'playlist' : 'playlists'}:
              </span>{' '}
              {summarizeNames(alreadyIn.map((playlist) => playlist.name))}. You can still add it
              to another set.
            </p>
          </div>
        ) : null}

        <div className="min-h-0 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {userPlaylists.map((playlist) => {
              const added = playlist.tracks.some((track) => sameTrack(track, song))
              return (
                <li key={playlist.id}>
                  <button
                    type="button"
                    onClick={() => add(playlist.id)}
                    disabled={added}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition',
                      added
                        ? 'cursor-default bg-primary-soft/60 text-primary'
                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                    )}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-elevated text-text-muted">
                      <HugeiconsIcon icon={MusicNote02Icon} size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{playlist.name}</span>
                      <span
                        className={cn(
                          'mt-0.5 block text-[10px]',
                          added ? 'text-primary/80' : 'text-text-muted',
                        )}
                      >
                        {added
                          ? 'Already in this playlist'
                          : `${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'song' : 'songs'}`}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full border',
                        added
                          ? 'border-primary/40 bg-primary text-white'
                          : 'border-border text-text-muted',
                      )}
                    >
                      <HugeiconsIcon icon={added ? Tick02Icon : PlusSignIcon} size={13} />
                    </span>
                    {added ? <span className="sr-only">Already added</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <form
          onSubmit={createAndAdd}
          className="flex items-center gap-2 border-t border-border px-5 py-4"
        >
          <label htmlFor="add-to-playlist-new-name" className="sr-only">
            New playlist name
          </label>
          <input
            id="add-to-playlist-new-name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={60}
            placeholder="New playlist name"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={newName.trim().length === 0}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Create playlist and add song"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} />
          </button>
        </form>

        <div className="flex items-center justify-end border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="h-9 rounded-lg bg-primary px-4 text-[11px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
