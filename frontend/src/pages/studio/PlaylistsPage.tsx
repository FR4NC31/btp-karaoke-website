import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FilterHorizontalIcon,
  Playlist01Icon,
  PlusSignIcon,
  TrendingUpIcon,
} from '@hugeicons/core-free-icons'
import MediaCarousel from '../../components/MediaCarousel'
import type { KaraokeVideoApi } from '../../lib/karaoke-player'
import { usePlaylistLibrary } from '../../lib/playlist-library'
import CreatePlaylistDialog from './components/playlists/CreatePlaylistDialog'
import DeletePlaylistDialog from './components/playlists/DeletePlaylistDialog'
import GenreFilterMenu from './components/playlists/GenreFilterMenu'
import LikedSongsStrip from './components/playlists/LikedSongsStrip'
import PlaylistCard from './components/playlists/PlaylistCard'
import PlaylistsSkeleton from './components/playlists/PlaylistsSkeleton'
import RenamePlaylistDialog from './components/playlists/RenamePlaylistDialog'
import TrendingPlaylistCard from './components/playlists/TrendingPlaylistCard'
import {
  libraryDuration,
  type NewPlaylistInput,
  type Playlist,
  type PlaylistGenre,
} from './components/playlists/mock-playlists'
import { usePlaylistCatalog } from './components/playlists/use-playlist-catalog'
import { usePlaylistPlayback } from './components/playlists/use-playlist-playback'

export default function PlaylistsPage() {
  const {
    userPlaylists,
    trendingPlaylists,
    likedSongs,
    createPlaylist,
    deletePlaylist,
  } = usePlaylistLibrary()
  const { byTitle, loaded, error: catalogError, retry: retryCatalog } = usePlaylistCatalog()
  const { playPlaylist } = usePlaylistPlayback()
  const player = useOutletContext<KaraokeVideoApi>()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeGenres, setActiveGenres] = useState<PlaylistGenre[]>([])
  const [pendingRename, setPendingRename] = useState<Playlist | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Playlist | null>(null)
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [playError, setPlayError] = useState('')

  const filtered = useMemo(
    () =>
      activeGenres.length === 0
        ? userPlaylists
        : userPlaylists.filter((playlist) =>
            playlist.genres.some((genre) => activeGenres.includes(genre)),
          ),
    [activeGenres, userPlaylists],
  )

  const totalTracks = userPlaylists.reduce((count, playlist) => count + playlist.tracks.length, 0)
  const playlistCount = `${userPlaylists.length} ${userPlaylists.length === 1 ? 'playlist' : 'playlists'}`
  const trackCount = `${totalTracks} ${totalTracks === 1 ? 'track' : 'tracks'}`
  const stats = `${playlistCount} · ${trackCount} · ${libraryDuration(userPlaylists)}`

  function play(playlist: Playlist) {
    setPlayError('')
    void playPlaylist(playlist, { shuffle: player.shuffle }).then((result) => {
      if (result === 'empty') {
        setPlayError(`Nothing in ${playlist.name} has a playable source yet.`)
      }
    })
  }

  function create(input: NewPlaylistInput) {
    createPlaylist(input)
    setActiveGenres([])
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const playlist = pendingDelete
    setPendingDelete(null)
    setDeletingIds((current) =>
      current.includes(playlist.id) ? current : [...current, playlist.id],
    )
    window.setTimeout(() => {
      deletePlaylist(playlist.id)
      setDeletingIds((current) => current.filter((id) => id !== playlist.id))
    }, 200)
  }

  function toggleGenre(genre: PlaylistGenre) {
    setActiveGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    )
  }

  if (!loaded) {
    return <PlaylistsSkeleton />
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">
            Your library
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Playlists
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            Build setlists for the lounge, filter by genre and send them to the console.
          </p>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.14em] text-text-muted uppercase">
            {stats}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GenreFilterMenu
            selected={activeGenres}
            playlists={userPlaylists}
            onToggle={toggleGenre}
            onClear={() => setActiveGenres([])}
          />

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} />
            New Playlist
          </button>
        </div>
      </header>

      {catalogError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-xs text-text-secondary"
        >
          <p>Cover art and playback matching could not load. Saved sources still play.</p>
          <button
            type="button"
            onClick={retryCatalog}
            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-[10px] font-bold tracking-wider text-text-primary uppercase transition hover:border-primary/40"
          >
            Retry
          </button>
        </div>
      ) : null}

      {playError ? (
        <div
          role="alert"
          className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-text-secondary"
        >
          {playError}
        </div>
      ) : null}

      <LikedSongsStrip playlist={likedSongs} onPlay={play} />

      <section aria-labelledby="trending-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={TrendingUpIcon} size={18} className="text-primary" />
            <h2
              id="trending-heading"
              className="font-heading text-xl font-bold tracking-wide uppercase"
            >
              Trending
            </h2>
            <span className="text-[10px] tracking-widest text-text-muted uppercase">
              Curated this week
            </span>
          </div>
          <span className="text-xs text-primary">Audio + video</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {trendingPlaylists.map((playlist) => (
            <TrendingPlaylistCard
              key={playlist.id}
              playlist={playlist}
              byTitle={byTitle}
              onPlay={play}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="your-playlists-heading">
        {activeGenres.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold tracking-[0.14em] text-text-muted uppercase">
              Filtered by
            </span>
            {activeGenres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-primary"
              >
                {genre}
              </span>
            ))}
            <button
              type="button"
              onClick={() => setActiveGenres([])}
              className="text-[10px] font-semibold text-text-muted underline-offset-2 transition hover:text-text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        ) : null}

        <MediaCarousel
          label="Your Playlists"
          as="ul"
          count={filtered.length}
          header={
            <>
              <HugeiconsIcon icon={Playlist01Icon} size={18} className="text-primary" />
              <h2
                id="your-playlists-heading"
                className="font-heading text-xl font-bold tracking-wide uppercase"
              >
                Your Playlists
              </h2>
              <span className="text-[10px] tracking-widest text-text-muted uppercase">
                Saved sets
              </span>
            </>
          }
          aside={
            <span className="text-xs text-primary">
              {activeGenres.length > 0
                ? `${filtered.length} of ${userPlaylists.length} ${userPlaylists.length === 1 ? 'playlist' : 'playlists'}`
                : playlistCount}
            </span>
          }
          itemClassName="[&>*]:w-full md:[&>*]:w-[calc((100%-4rem)/5)] md:[&>*]:min-w-[13rem]"
          railClassName="max-md:grid max-md:grid-cols-1 max-md:overflow-visible"
        >
          {filtered.map((playlist) => (
            <li key={playlist.id} className="flex">
              <PlaylistCard
                playlist={playlist}
                byTitle={byTitle}
                onPlay={play}
                onRequestRename={setPendingRename}
                onRequestDelete={setPendingDelete}
                removing={deletingIds.includes(playlist.id)}
              />
            </li>
          ))}
        </MediaCarousel>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center">
            {userPlaylists.length === 0 ? (
              <>
                <HugeiconsIcon
                  icon={Playlist01Icon}
                  size={24}
                  className="mx-auto text-text-muted"
                />
                <p className="mt-3 text-sm font-semibold">No playlists yet</p>
                <p className="mt-1 text-xs text-text-muted">
                  Create your first set and send it to the lounge console.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-4 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover"
                >
                  New Playlist
                </button>
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={FilterHorizontalIcon}
                  size={24}
                  className="mx-auto text-text-muted"
                />
                <p className="mt-3 text-sm font-semibold">No playlists match those genres</p>
                <p className="mt-1 text-xs text-text-muted">
                  Clear the filter or create a new set for this mood.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveGenres([])}
                  className="mt-4 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-[10px] font-bold tracking-wider text-text-secondary uppercase transition hover:text-text-primary"
                >
                  Clear filter
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[9px] font-semibold tracking-[0.12em] text-text-muted uppercase">
        <p>Playlists are local to this studio for now.</p>
        <p>Studio session · local</p>
      </div>

      <CreatePlaylistDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={create} />

      {pendingRename ? (
        <RenamePlaylistDialog
          playlist={pendingRename}
          open
          onOpenChange={(open) => {
            if (!open) setPendingRename(null)
          }}
        />
      ) : null}

      {pendingDelete ? (
        <DeletePlaylistDialog
          playlist={pendingDelete}
          open
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null)
          }}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  )
}
