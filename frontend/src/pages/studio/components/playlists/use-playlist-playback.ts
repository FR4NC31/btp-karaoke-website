import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useLoungeQueue, type QueueInput } from '../../../../lib/lounge-queue'
import type { MediaItem } from '../../../../lib/media-api'
import type { Playlist, PlaylistTrack } from './mock-playlists'
import { loadPlaylistCatalog, matchMediaItem } from './use-playlist-catalog'

export type PlaybackResult = 'started' | 'empty' | 'stale'

// One playback request at a time across every playlist page instance. A slow
// catalog response must never replace the queue after a newer click.
let playbackRequest = 0

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

export function resolvePlaylistTrack(track: PlaylistTrack, catalog: MediaItem[]) {
  const item = matchMediaItem(track.title, track.mediaId, catalog)
  const source = item?.sourceUrl ?? track.sourceUrl
  const kind: 'video' | 'music' = item
    ? item.section === 'music'
      ? 'music'
      : 'video'
    : (track.kind ?? 'video')
  const playable = Boolean(item || source) && !(kind === 'music' && !source)
  return { item, source, kind, playable }
}

async function resolveRows(
  tracks: PlaylistTrack[],
): Promise<Array<{ row: QueueInput; item: MediaItem }>> {
  let catalog: MediaItem[] = []
  try {
    catalog = await loadPlaylistCatalog()
  } catch {
    // The playlist itself still knows each track's captured sourceUrl. Keep
    // going with an empty catalog instead of making the whole set unplayable.
  }

  const resolved: Array<{ row: QueueInput; item: MediaItem }> = []

  for (const track of tracks) {
    const { item, source, kind, playable } = resolvePlaylistTrack(track, catalog)
    if (!playable) continue

    // A catalog match without its own URL must still carry the track's saved
    // source, otherwise autoplay falls back to the bundled master.
    const mediaItem = item ? { ...item, sourceUrl: source } : buildMediaItem(track, source!)

    resolved.push({
      item: mediaItem,
      row: {
        title: track.title,
        artist: track.artist,
        len: track.duration,
        coverUrl: mediaItem.coverUrl ?? track.coverUrl,
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
    async (tracks: PlaylistTrack[], options?: { shuffle?: boolean }): Promise<PlaybackResult> => {
      const requestId = ++playbackRequest
      const resolved = await resolveRows(tracks)
      if (requestId !== playbackRequest) return 'stale'
      if (resolved.length === 0) return 'empty'

      // Keep the queue in playlist order. Shuffle mode picks a random starter
      // and StudioPlayer draws the rest, so turning shuffle off restores the
      // original rail instead of leaving a pre-shuffled queue behind.
      const first = options?.shuffle
        ? (resolved[Math.floor(Math.random() * resolved.length)] ?? resolved[0])
        : resolved[0]
      if (!first) return 'empty'

      clear()
      resolved.forEach(({ row }) => add(row))
      navigate('/studio/player-queue', {
        state: { autoplay: true, item: first.item },
      })
      return 'started'
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
