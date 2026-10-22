import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  PlayIcon,
  Playlist01Icon,
  ShuffleIcon,
} from '@hugeicons/core-free-icons'
import { useLoungeQueue } from '../../lib/lounge-queue'
import { usePageTitle } from '../../lib/page-title'
import { usePlaylistLibrary } from '../../lib/playlist-library'
import type { KaraokeVideoApi } from '../../lib/karaoke-player'
import DeletePlaylistDialog from './components/playlists/DeletePlaylistDialog'
import PlaylistDetailSkeleton from './components/playlists/PlaylistDetailSkeleton'
import PlaylistMosaic from './components/playlists/PlaylistMosaic'
import PlaylistTrackRow from './components/playlists/PlaylistTrackRow'
import {
  playlistDuration,
  type PlaylistTrack,
} from './components/playlists/mock-playlists'
import { usePlaylistCatalog } from './components/playlists/use-playlist-catalog'
import {
  resolvePlaylistTrack,
  usePlaylistPlayback,
  type PlaybackResult,
} from './components/playlists/use-playlist-playback'

function titleKey(value: string): string {
  return value.trim().toLowerCase()
}

export default function PlaylistDetailPage() {
  const { playlistId = '' } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()
  const { findPlaylist, deletePlaylist, removeTrack } = usePlaylistLibrary()
  const playlist = findPlaylist(playlistId)
  usePageTitle(playlist?.name ?? 'Playlist')

  const {
    items,
    byTitle,
    loaded,
    error: catalogError,
    retry: retryCatalog,
  } = usePlaylistCatalog()
  const { playPlaylist, playTracks } = usePlaylistPlayback()
  const { add } = useLoungeQueue()
  const player = useOutletContext<KaraokeVideoApi>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [removingTrackIds, setRemovingTrackIds] = useState<string[]>([])
  const [playError, setPlayError] = useState('')

  if (!playlist) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-elevated text-text-muted">
          <HugeiconsIcon icon={Playlist01Icon} size={22} />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-wide uppercase">
          Playlist not found
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          This set may have been removed, or the link is out of date.
        </p>
        <Link
          to="/studio/playlists"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[11px] font-bold tracking-wider text-text-primary uppercase transition hover:bg-primary-hover"
        >
          Back to playlists
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      </div>
    )
  }

  if (!loaded) {
    return <PlaylistDetailSkeleton />
  }

  const playlistIdValue = playlist.id
  const count = playlist.tracks.length
  const duration = playlistDuration(playlist.tracks)
  const curated = playlist.system && playlist.id !== 'liked-songs'
  const onAirKey = player.onAir ? titleKey(player.onAir.title) : null

  function resolve(track: PlaylistTrack) {
    return resolvePlaylistTrack(track, items)
  }

  const playableCount = playlist.tracks.filter((track) => resolve(track).playable).length

  function startPlayback(
    result: Promise<PlaybackResult>,
    emptyMessage = 'Nothing in this set has a playable source yet.',
  ) {
    setPlayError('')
    void result.then((outcome) => {
      if (outcome === 'empty') setPlayError(emptyMessage)
    })
  }

  function queueTrack(track: PlaylistTrack) {
    const { item, source, kind, playable } = resolve(track)
    if (!playable) return
    add({
      title: track.title,
      artist: track.artist,
      len: track.duration,
      coverUrl: item?.coverUrl ?? track.coverUrl,
      src: source,
      kind,
      mediaId: item?.id ?? track.mediaId,
    })
  }

  function requestRemove(trackId: string) {
    setRemovingTrackIds((current) =>
      current.includes(trackId) ? current : [...current, trackId],
    )
    window.setTimeout(() => {
      removeTrack(playlistIdValue, trackId)
      setRemovingTrackIds((current) => current.filter((id) => id !== trackId))
    }, 200)
  }

  return (
    <div className="space-y-7">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
        <Link
          to="/studio/playlists"
          className="inline-flex items-center gap-1.5 text-text-muted transition hover:text-text-primary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
          All playlists
        </Link>
        <span className="text-text-muted">/</span>
        <span className="truncate text-text-secondary">{playlist.name}</span>
      </nav>

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

      <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="w-40 shrink-0 sm:w-52">
          <div className="aspect-square overflow-hidden rounded-xl border border-border shadow-2xl">
            <PlaylistMosaic tracks={playlist.tracks} tone={playlist.tone} byTitle={byTitle} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">
            {curated ? 'Curated playlist' : playlist.system ? 'System playlist' : 'Playlist'} ·{' '}
            {playlist.createdBy}
          </p>
          <h1 className="mt-1 font-heading text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            {playlist.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {playlist.description}
          </p>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.13em] text-text-muted uppercase">
            {count} {count === 1 ? 'song' : 'songs'} · {duration} · Updated {playlist.updated}
          </p>

          {playlist.genres.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {playlist.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[9px] font-bold tracking-wider text-text-secondary uppercase"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label={`Play ${playlist.name}`}
              title="Play"
              onClick={() =>
                startPlayback(playPlaylist(playlist, { shuffle: player.shuffle }))
              }
              disabled={playableCount === 0}
              className="grid size-10 place-items-center rounded-lg bg-primary text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              <HugeiconsIcon icon={PlayIcon} size={17} />
            </button>
            <button
              type="button"
              aria-label={`Shuffle ${playlist.name}`}
              aria-pressed={player.shuffle}
              title={player.shuffle ? 'Shuffle on' : 'Shuffle off'}
              onClick={() => player.setShuffle(!player.shuffle)}
              disabled={playableCount === 0}
              className={`grid size-10 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-45 ${
                player.shuffle
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'border-border bg-surface-elevated text-text-secondary hover:border-primary/40 hover:text-text-primary'
              }`}
            >
              <HugeiconsIcon icon={ShuffleIcon} size={17} />
            </button>
            {!playlist.system ? (
              <button
                type="button"
                aria-label={`Delete ${playlist.name}`}
                title="Delete playlist"
                onClick={() => setDeleteOpen(true)}
                className="grid size-10 place-items-center rounded-lg border border-border bg-surface-elevated text-text-muted transition hover:border-error/50 hover:text-error"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </button>
            ) : null}
            {playlist.system ? (
              <span className="ml-1 rounded-full border border-primary/25 bg-primary-soft px-2.5 py-1 text-[9px] font-bold tracking-wider text-primary uppercase">
                {curated ? 'Curated' : 'Auto-managed'}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="tracklist-heading" className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
          <h2 id="tracklist-heading" className="font-heading text-xl font-bold tracking-wide uppercase">
            Tracklist
          </h2>
          <span className="text-[10px] font-semibold tracking-[0.12em] text-text-muted uppercase">
            {count} {count === 1 ? 'song' : 'songs'} · {duration}
          </span>
        </div>

        {count === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-elevated text-text-muted">
              <HugeiconsIcon icon={Playlist01Icon} size={22} />
            </span>
            <p className="mt-3 text-sm font-semibold">This playlist is empty</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-text-muted">
              Add songs from the media hub, or use Add to playlist from any song menu.
            </p>
            <Link
              to="/studio"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-[10px] font-bold tracking-wider text-text-secondary uppercase transition hover:border-primary/40 hover:text-text-primary"
            >
              Browse the media hub
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </Link>
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="hidden grid-cols-[2rem_minmax(0,1.45fr)_minmax(0,1fr)_4.5rem_3.5rem_4.5rem] gap-3 border-b border-border px-3 py-2 text-[9px] font-bold tracking-[0.14em] text-text-muted uppercase sm:grid"
            >
              <span>#</span>
              <span>Title</span>
              <span>Album</span>
              <span>Added</span>
              <span className="text-right">Time</span>
              <span />
            </div>
            <ol aria-label={`${playlist.name} tracks`}>
              {playlist.tracks.map((track, index) => (
                <PlaylistTrackRow
                  key={track.id}
                  index={index + 1}
                  track={track}
                  coverUrl={
                    track.coverUrl ?? byTitle.get(titleKey(track.title))?.coverUrl ?? null
                  }
                  playing={onAirKey === titleKey(track.title)}
                  canPlay={resolve(track).playable}
                  canQueue={resolve(track).playable}
                  canRemove={!playlist.system}
                  removing={removingTrackIds.includes(track.id)}
                  removeNote={
                    curated ? 'This curated set is managed by the studio.' : undefined
                  }
                  onPlay={() =>
                    startPlayback(playTracks([track]), 'This track has no playable source yet.')
                  }
                  onQueue={() => queueTrack(track)}
                  onRemove={() => requestRemove(track.id)}
                />
              ))}
            </ol>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[9px] font-semibold tracking-[0.12em] text-text-muted uppercase">
        <p>
          {curated
            ? 'Curated by the studio.'
            : playlist.system
              ? 'Managed by the heart button.'
              : 'Playlist saved to this studio session.'}
        </p>
        <p>Studio session · local</p>
      </div>

      {!playlist.system ? (
        <DeletePlaylistDialog
          playlist={playlist}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={() => {
            setDeleteOpen(false)
            deletePlaylist(playlist.id)
            navigate('/studio/playlists')
          }}
        />
      ) : null}
    </div>
  )
}
