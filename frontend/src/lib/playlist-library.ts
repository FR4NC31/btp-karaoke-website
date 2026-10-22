import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  allPlaylists,
  sameTrack,
  type NewPlaylistInput,
  type NewTrackInput,
  type Playlist,
  type PlaylistTone,
} from '../pages/studio/components/playlists/mock-playlists'

const CREATE_TONES: PlaylistTone[] = ['red', 'rose', 'amber', 'teal', 'charcoal']

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42)
  return slug || 'playlist'
}

export interface PlaylistLibraryApi {
  playlists: Playlist[]
  userPlaylists: Playlist[]
  trendingPlaylists: Playlist[]
  likedSongs: Playlist
  createPlaylist: (input: NewPlaylistInput) => Playlist
  deletePlaylist: (playlistId: string) => void
  addTrack: (playlistId: string, input: NewTrackInput) => void
  removeTrack: (playlistId: string, trackId: string) => void
  findPlaylist: (id: string) => Playlist | null
}

export function usePlaylistLibraryState(): PlaylistLibraryApi {
  const [playlists, setPlaylists] = useState<Playlist[]>(allPlaylists)

  const createPlaylist = useCallback((input: NewPlaylistInput) => {
    const name = input.name.trim()
    const created: Playlist = {
      id: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      description: input.description.trim(),
      genres: [input.genre],
      tone: CREATE_TONES[Math.floor(Math.random() * CREATE_TONES.length)] ?? 'red',
      updated: 'Just now',
      createdBy: 'You',
      tracks: [],
    }
    setPlaylists((rows) => [...rows, created])
    return created
  }, [])

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((rows) =>
      rows.filter((playlist) => playlist.id !== playlistId || playlist.system),
    )
  }, [])

  const addTrack = useCallback((playlistId: string, input: NewTrackInput) => {
    const trackId = crypto.randomUUID()
    setPlaylists((rows) =>
      rows.map((playlist) => {
        if (playlist.id !== playlistId || playlist.system) return playlist
        if (playlist.tracks.some((track) => sameTrack(track, input))) return playlist
        return {
          ...playlist,
          updated: 'Just now',
          tracks: [
            ...playlist.tracks,
            {
              id: trackId,
              title: input.title,
              artist: input.artist,
              album: input.album ?? '',
              duration: input.duration ?? '',
              added: 'Just now',
              coverUrl: input.coverUrl ?? null,
              sourceUrl: input.sourceUrl ?? null,
              mediaId: input.mediaId ?? null,
              kind: input.kind ?? 'video',
            },
          ],
        }
      }),
    )
  }, [])

  const removeTrack = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((rows) =>
      rows.map((playlist) => {
        if (playlist.id !== playlistId || playlist.system) return playlist
        return {
          ...playlist,
          updated: 'Just now',
          tracks: playlist.tracks.filter((track) => track.id !== trackId),
        }
      }),
    )
  }, [])

  const userPlaylists = useMemo(
    () => playlists.filter((playlist) => !playlist.system),
    [playlists],
  )
  const trending = useMemo(
    () => playlists.filter((playlist) => playlist.system && playlist.id !== 'liked-songs'),
    [playlists],
  )
  const liked = useMemo(
    () => playlists.find((playlist) => playlist.id === 'liked-songs') ?? allPlaylists[0]!,
    [playlists],
  )
  const findPlaylist = useCallback(
    (id: string) => playlists.find((playlist) => playlist.id === id) ?? null,
    [playlists],
  )

  return useMemo(
    () => ({
      playlists,
      userPlaylists,
      trendingPlaylists: trending,
      likedSongs: liked,
      createPlaylist,
      deletePlaylist,
      addTrack,
      removeTrack,
      findPlaylist,
    }),
    [
      playlists,
      userPlaylists,
      trending,
      liked,
      createPlaylist,
      deletePlaylist,
      addTrack,
      removeTrack,
      findPlaylist,
    ],
  )
}

const PlaylistLibraryContext = createContext<PlaylistLibraryApi | null>(null)

export function PlaylistLibraryProvider({
  api,
  children,
}: {
  api: PlaylistLibraryApi
  children: ReactNode
}) {
  return createElement(PlaylistLibraryContext.Provider, { value: api }, children)
}

export function usePlaylistLibrary(): PlaylistLibraryApi {
  const api = useContext(PlaylistLibraryContext)
  if (!api) throw new Error('usePlaylistLibrary must be used inside the studio shell.')
  return api
}
