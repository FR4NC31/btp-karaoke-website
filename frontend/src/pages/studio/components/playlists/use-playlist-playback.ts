import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useLoungeQueue, type QueueInput } from '../../../../lib/lounge-queue'
import type { MediaItem } from '../../../../lib/media-api'
import type { Playlist, PlaylistTrack } from './mock-playlists'
import { loadPlaylistCatalog, matchMediaItem } from './use-playlist-catalog'

function shuffleRows<T>(rows: T[]): T[] {
  const next = [...rows]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    const swap = next[swapIndex]
    if (current === undefined || swap === undefined) continue
    next[index] = swap
    next[swapIndex] = current
  }
  return next
}

function buildMediaItem(track: PlaylistTrack, source: string): MediaItem {
  return {
    id: `playlist-${track.id}`,
    section: track.kind === 'music' ? 'music' : 'video',
    title: track.title,
    subtitle: track.artist,
    artist: track.artist,
    tag: null,
    duration: track.duration || null,
    plays: null,
    tempo: null,
    songKey: null,
    freq: null,
    listeners: null,
    sourceUrl: source,
    album: track.album || null,
    coverUrl: track.coverUrl,
    sortOrder: 0,
  }
}

async function resolveRows(
  tracks: PlaylistTrack[],
): Promise<Array<{ row: QueueInput; item: MediaItem }>> {
  let catalog: MediaItem[]
  try {
    catalog = await loadPlaylistCatalog()
  } catch {
    return []
  }

  const resolved: Array<{ row: QueueInput; item: MediaItem }> = []

  for (const track of tracks) {
    const item = matchMediaItem(track.title, track.mediaId, catalog)
    const source = item?.sourceUrl ?? track.sourceUrl
    const kind: 'video' | 'music' = item
      ? item.section === 'music'
        ? 'music'
        : 'video'
      : (track.kind ?? 'video')

    if (!item && !source) continue
    if (kind === 'music' && !source) continue

    resolved.push({
      item: item ?? buildMediaItem(track, source!),
      row: {
        title: track.title,
        artist: track.artist,
        len: track.duration,
        coverUrl: item?.coverUrl ?? track.coverUrl,
        src: source,
        kind,
        mediaId: item?.id ?? track.mediaId,
      },
    })
  }

  return resolved
}

export function usePlaylistPlayback() {
  const { add, clear } = useLoungeQueue()
  const navigate = useNavigate()

  const playTracks = useCallback(
    async (tracks: PlaylistTrack[], options?: { shuffle?: boolean }) => {
      const resolved = await resolveRows(tracks)
      if (resolved.length === 0) return false

      const ordered = options?.shuffle ? shuffleRows(resolved) : resolved
      const first = ordered[0]
      if (!first) return false

      clear()
      ordered.forEach(({ row }) => add(row))
      navigate('/studio/player-queue', {
        state: { autoplay: true, item: first.item },
      })
      return true
    },
    [add, clear, navigate],
  )

  const playPlaylist = useCallback(
    (playlist: Playlist, options?: { shuffle?: boolean }) =>
      playTracks(playlist.tracks, options),
    [playTracks],
  )

  return { playPlaylist, playTracks }
}
