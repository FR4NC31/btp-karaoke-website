import { useId, useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterHorizontalIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover'
import { cn } from '../../../../lib/utils'
import {
  PLAYLIST_GENRES,
  type Playlist,
  type PlaylistGenre,
} from './mock-playlists'

type GenreFilterMenuProps = {
  selected: PlaylistGenre[]
  playlists: Playlist[]
  onToggle: (genre: PlaylistGenre) => void
  onClear: () => void
}

export default function GenreFilterMenu({
  selected,
  playlists,
  onToggle,
  onClear,
}: GenreFilterMenuProps) {
  const titleId = useId()
  const descriptionId = useId()

  const counts = useMemo(() => {
    const result = new Map<PlaylistGenre, number>()
    for (const genre of PLAYLIST_GENRES) {
      result.set(genre, playlists.filter((playlist) => playlist.genres.includes(genre)).length)
    }
    return result
  }, [playlists])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            selected.length > 0
              ? `Filter playlists, ${selected.length} selected`
              : 'Filter playlists'
          }
          aria-haspopup="dialog"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-[11px] font-bold tracking-wider uppercase transition',
            selected.length > 0
              ? 'border-primary/50 bg-primary-soft text-primary'
              : 'border-border bg-surface-elevated text-text-secondary hover:border-primary/35 hover:text-text-primary',
          )}
        >
          <HugeiconsIcon icon={FilterHorizontalIcon} size={15} />
          Filter
          {selected.length > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[9px] text-white">
              {selected.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100dvh-1.5rem)] w-72 max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto border border-border bg-surface p-0 text-text-primary shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
            <HugeiconsIcon icon={FilterHorizontalIcon} size={20} />
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate font-heading text-sm leading-tight font-bold tracking-wide uppercase"
            >
              Filter playlists
            </h2>
            <p id={descriptionId} className="mt-0.5 truncate text-[10px] text-text-muted">
              {selected.length === 0
                ? 'All saved playlists'
                : `${selected.length} ${selected.length === 1 ? 'genre' : 'genres'} selected`}
            </p>
          </div>
        </div>

        <div className="p-1.5">
          {PLAYLIST_GENRES.map((genre) => {
            const checked = selected.includes(genre)
            const count = counts.get(genre) ?? 0
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={checked}
                aria-label={`${genre}, ${count} ${count === 1 ? 'playlist' : 'playlists'}`}
                onClick={() => onToggle(genre)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-[13px] font-semibold transition',
                  checked
                    ? 'bg-primary-soft text-text-primary'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded border transition',
                    checked
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-background text-transparent',
                  )}
                >
                  <HugeiconsIcon icon={Tick02Icon} size={13} />
                </span>
                <span className="min-w-0 flex-1 truncate">{genre}</span>
                <span
                  aria-hidden="true"
                  className="rounded border border-border px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-text-muted uppercase"
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={onClear}
            disabled={selected.length === 0}
            className="text-[11px] font-semibold text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear all
          </button>
          <PopoverClose asChild>
            <button
              type="button"
              className="rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover"
            >
              Done
            </button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}
