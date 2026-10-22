import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useLoungeQueue, type QueueInput } from '../../../../lib/lounge-queue'
import type { MediaItem } from '../../../../lib/media-api'
import type { Playlist, PlaylistTrack } from './mock-playlists'
import { loadPlaylistCatalog, matchMediaItem } from './use-playlist-catalog'

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

      // Keep the queue in playlist order. Shuffle mode picks a random starter
      // and StudioPlayer draws the rest, so turning shuffle off restores the
      // original rail instead of leaving a pre-shuffled queue behind.
      const first = options?.shuffle
        ? (resolved[Math.floor(Math.random() * resolved.length)] ?? resolved[0])
        : resolved[0]
      if (!first) return false

      clear()
      resolved.forEach(({ row }) => add(row))
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
