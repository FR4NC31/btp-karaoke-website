export const PLAYLIST_GENRES = [
  'OPM',
  'Pop',
  'Rock',
  'Acoustic',
  'Duets',
  'Ballads',
  'Indie',
  'High-Energy',
] as const

export type PlaylistGenre = (typeof PLAYLIST_GENRES)[number]

export type PlaylistTone = 'red' | 'rose' | 'amber' | 'teal' | 'charcoal'

export interface PlaylistTrack {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  added: string
  coverUrl: string | null
  sourceUrl: string | null
  mediaId: string | null
  kind: 'video' | 'music'
}

export interface Playlist {
  id: string
  name: string
  description: string
  genres: PlaylistGenre[]
  tone: PlaylistTone
  updated: string
  createdBy: string
  system?: boolean
  tracks: PlaylistTrack[]
}

export interface NewPlaylistInput {
  name: string
  description: string
  genre: PlaylistGenre
}

export interface NewTrackInput {
  title: string
  artist: string
  album?: string
  duration?: string
  coverUrl?: string | null
  sourceUrl?: string | null
  mediaId?: string | null
  kind?: 'video' | 'music'
}

type TrackSeed = Omit<PlaylistTrack, 'id' | 'added'>

const trackSeeds = {
  reason: {
    title: 'The Reason',
    artist: 'Hoobastank',
    album: 'KTV Master',
    duration: '3:54',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  dieWithASmile: {
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Pop Duets',
    duration: '4:11',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  espresso: {
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Pop Sessions',
    duration: '2:55',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  beautifulThings: {
    title: 'Beautiful Things',
    artist: 'Benson Boone',
    album: 'Pop Sessions',
    duration: '3:00',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  lovely: {
    title: 'Lovely',
    artist: 'Billie Eilish & Khalid',
    album: 'Duet Masters',
    duration: '3:20',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  hulingSandali: {
    title: 'Huling Sandali',
    artist: 'December Avenue',
    album: 'OPM Sessions',
    duration: '4:12',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  sana: {
    title: 'Sana',
    artist: 'Up Dharma Down',
    album: 'OPM Sessions',
    duration: '4:36',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  tadhana: {
    title: 'Tadhana',
    artist: 'Up Dharma Down',
    album: 'OPM Sessions',
    duration: '4:12',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  buwan: {
    title: 'Buwan',
    artist: 'Juan Karlos',
    album: 'OPM Sessions',
    duration: '4:32',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  narda: {
    title: 'Narda',
    artist: 'Kamikazee',
    album: 'Pinoy Rock',
    duration: '3:24',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  twoFourteen: {
    title: '214',
    artist: 'Rivermaya',
    album: 'OPM Sessions',
    duration: '4:02',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  kisapmata: {
    title: 'Kisapmata',
    artist: 'Rivermaya',
    album: 'Pinoy Rock',
    duration: '4:18',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  bakitPartTwo: {
    title: 'Bakit Part 2',
    artist: 'Mayonnaise',
    album: 'Pinoy Rock',
    duration: '4:10',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  awitNgKabataan: {
    title: 'Awit ng Kabataan',
    artist: 'Rivermaya',
    album: 'OPM Sessions',
    duration: '4:45',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  paraSaAkin: {
    title: 'Para sa Akin',
    artist: 'Sitti',
    album: 'Lounge Sessions',
    duration: '3:35',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  ikaw: {
    title: 'Ikaw',
    artist: 'Yeng Constantino',
    album: 'OPM Sessions',
    duration: '4:20',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  sundo: {
    title: 'Sundo',
    artist: 'Imago',
    album: 'OPM Sessions',
    duration: '4:05',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  magbalik: {
    title: 'Magbalik',
    artist: 'Callalily',
    album: 'Pinoy Rock',
    duration: '4:10',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  jeepney: {
    title: 'Jeepney',
    artist: 'Sponge Cola',
    album: 'Pinoy Rock',
    duration: '3:48',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
  migraine: {
    title: 'Migraine',
    artist: 'Moonstar88',
    album: 'Pinoy Rock',
    duration: '4:00',
    coverUrl: null,
    sourceUrl: null,
    mediaId: null,
    kind: 'video',
  },
} satisfies Record<string, TrackSeed>

function track(key: keyof typeof trackSeeds, added: string): PlaylistTrack {
  return { id: `seed-${key}`, ...trackSeeds[key], added }
}

export const TONE_TILES: Record<PlaylistTone, [string, string, string, string]> = {
  red: [
    'linear-gradient(140deg, rgba(126,33,38,0.96), rgba(30,13,15,0.72) 58%, rgba(12,12,13,0.96)), repeating-linear-gradient(135deg, transparent 0 10px, rgba(244,244,242,0.055) 10px 11px)',
    'radial-gradient(circle at 25% 20%, rgba(211,47,47,0.52), transparent 58%), linear-gradient(160deg, rgba(58,23,25,0.92), rgba(12,12,13,0.98))',
    'linear-gradient(125deg, rgba(69,27,28,0.9), rgba(19,12,13,0.84) 52%, rgba(9,9,10,0.98)), repeating-linear-gradient(45deg, transparent 0 14px, rgba(244,244,242,0.04) 14px 15px)',
    'radial-gradient(circle at 70% 72%, rgba(190,49,49,0.42), transparent 55%), linear-gradient(150deg, rgba(30,15,16,0.95), rgba(8,8,9,1))',
  ],
  rose: [
    'linear-gradient(145deg, rgba(91,35,53,0.95), rgba(27,14,21,0.9) 58%, rgba(10,9,11,0.98)), repeating-linear-gradient(135deg, transparent 0 11px, rgba(244,244,242,0.045) 11px 12px)',
    'radial-gradient(circle at 72% 28%, rgba(180,72,105,0.48), transparent 58%), linear-gradient(155deg, rgba(49,22,34,0.95), rgba(11,9,12,0.99))',
    'linear-gradient(120deg, rgba(63,27,43,0.94), rgba(19,12,16,0.9) 50%, rgba(9,8,10,0.99)), repeating-linear-gradient(45deg, transparent 0 13px, rgba(244,244,242,0.04) 13px 14px)',
    'radial-gradient(circle at 32% 76%, rgba(123,52,82,0.42), transparent 54%), linear-gradient(150deg, rgba(27,14,20,0.96), rgba(8,8,9,1))',
  ],
  amber: [
    'linear-gradient(145deg, rgba(121,70,25,0.95), rgba(37,21,13,0.9) 57%, rgba(11,10,9,0.99)), repeating-linear-gradient(135deg, transparent 0 10px, rgba(244,244,242,0.05) 10px 11px)',
    'radial-gradient(circle at 68% 24%, rgba(217,154,43,0.48), transparent 57%), linear-gradient(155deg, rgba(54,33,16,0.96), rgba(11,10,9,0.99))',
    'linear-gradient(125deg, rgba(75,43,19,0.93), rgba(23,16,11,0.9) 55%, rgba(9,9,8,1)), repeating-linear-gradient(45deg, transparent 0 14px, rgba(244,244,242,0.04) 14px 15px)',
    'radial-gradient(circle at 30% 75%, rgba(158,92,30,0.4), transparent 55%), linear-gradient(150deg, rgba(29,19,12,0.97), rgba(8,8,8,1))',
  ],
  teal: [
    'linear-gradient(145deg, rgba(24,73,70,0.94), rgba(13,27,27,0.9) 58%, rgba(9,11,11,0.99)), repeating-linear-gradient(135deg, transparent 0 11px, rgba(244,244,242,0.045) 11px 12px)',
    'radial-gradient(circle at 70% 25%, rgba(56,140,131,0.43), transparent 58%), linear-gradient(155deg, rgba(16,44,43,0.95), rgba(9,10,10,0.99))',
    'linear-gradient(120deg, rgba(18,56,54,0.92), rgba(12,22,22,0.9) 52%, rgba(8,9,9,1)), repeating-linear-gradient(45deg, transparent 0 13px, rgba(244,244,242,0.04) 13px 14px)',
    'radial-gradient(circle at 33% 73%, rgba(38,105,100,0.4), transparent 55%), linear-gradient(150deg, rgba(12,26,26,0.97), rgba(7,8,8,1))',
  ],
  charcoal: [
    'linear-gradient(145deg, rgba(51,54,58,0.95), rgba(19,20,22,0.94) 58%, rgba(9,10,11,1)), repeating-linear-gradient(135deg, transparent 0 12px, rgba(244,244,242,0.04) 12px 13px)',
    'radial-gradient(circle at 68% 24%, rgba(98,103,109,0.3), transparent 56%), linear-gradient(155deg, rgba(30,32,35,0.96), rgba(9,10,11,1))',
    'linear-gradient(120deg, rgba(41,44,48,0.92), rgba(18,19,21,0.92) 50%, rgba(8,9,10,1)), repeating-linear-gradient(45deg, transparent 0 14px, rgba(244,244,242,0.035) 14px 15px)',
    'radial-gradient(circle at 34% 74%, rgba(65,69,75,0.3), transparent 54%), linear-gradient(150deg, rgba(20,22,24,0.98), rgba(7,8,9,1))',
  ],
}

export const likedSongs: Playlist = {
  id: 'liked-songs',
  name: 'Liked Songs',
  description: 'Every song you have hearted in the studio, kept in one place.',
  genres: ['OPM', 'Pop'],
  tone: 'red',
  updated: 'Oct 21',
  createdBy: 'Managed by the studio',
  system: true,
  tracks: [track('reason', 'Oct 21')],
}

export const seedPlaylists: Playlist[] = [
  {
    id: 'late-night-opm',
    name: 'Late Night OPM',
    description: 'Slow burns and after-hours OPM for the last set.',
    genres: ['OPM', 'Ballads'],
    tone: 'red',
    updated: 'Oct 21',
    createdBy: 'Franc',
    tracks: [
      track('reason', 'Oct 21'),
      track('dieWithASmile', 'Oct 20'),
      track('espresso', 'Oct 18'),
      track('beautifulThings', 'Oct 17'),
      track('lovely', 'Oct 16'),
      track('hulingSandali', 'Oct 15'),
      track('sana', 'Oct 14'),
      track('tadhana', 'Oct 13'),
      track('buwan', 'Oct 12'),
    ],
  },
  {
    id: 'duets-and-harmonies',
    name: 'Duets & Harmonies',
    description: 'Two-mic songs for the crowd that sings together.',
    genres: ['Duets', 'Pop'],
    tone: 'rose',
    updated: 'Oct 20',
    createdBy: 'Franc',
    tracks: [
      track('dieWithASmile', 'Oct 20'),
      track('lovely', 'Oct 19'),
      track('ikaw', 'Oct 18'),
      track('sana', 'Oct 17'),
      track('tadhana', 'Oct 16'),
      track('paraSaAkin', 'Oct 15'),
      track('reason', 'Oct 14'),
      track('beautifulThings', 'Oct 13'),
    ],
  },
  {
    id: 'high-energy-ktv',
    name: 'High-Energy KTV',
    description: 'Loud, fast and built for the last hour of the night.',
    genres: ['Pop', 'Rock', 'High-Energy'],
    tone: 'amber',
    updated: 'Oct 18',
    createdBy: 'Franc',
    tracks: [
      track('narda', 'Oct 18'),
      track('twoFourteen', 'Oct 18'),
      track('kisapmata', 'Oct 17'),
      track('bakitPartTwo', 'Oct 17'),
      track('awitNgKabataan', 'Oct 16'),
      track('jeepney', 'Oct 16'),
      track('migraine', 'Oct 15'),
      track('reason', 'Oct 15'),
      track('espresso', 'Oct 14'),
      track('beautifulThings', 'Oct 14'),
      track('magbalik', 'Oct 13'),
      track('dieWithASmile', 'Oct 13'),
    ],
  },
  {
    id: 'acoustic-reset',
    name: 'Acoustic Reset',
    description: 'Stripped-back reset for the room after the high.',
    genres: ['Acoustic', 'OPM'],
    tone: 'teal',
    updated: 'Oct 16',
    createdBy: 'Franc',
    tracks: [
      track('hulingSandali', 'Oct 16'),
      track('sana', 'Oct 15'),
      track('buwan', 'Oct 14'),
      track('paraSaAkin', 'Oct 13'),
      track('ikaw', 'Oct 12'),
      track('sundo', 'Oct 11'),
    ],
  },
  {
    id: 'new-set-ideas',
    name: 'New Set Ideas',
    description: 'A scratchpad for the next setlist. Nothing locked yet.',
    genres: [],
    tone: 'charcoal',
    updated: 'Oct 12',
    createdBy: 'Franc',
    tracks: [],
  },
]

export const allPlaylists = [likedSongs, ...seedPlaylists]

export function parseDuration(value: string): number {
  const [minutes, seconds] = value.split(':').map(Number)
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0
  return minutes * 60 + seconds
}

export function playlistDuration(tracks: PlaylistTrack[]): string {
  const total = tracks.reduce((seconds, item) => seconds + parseDuration(item.duration), 0)
  if (total === 0) return '0 min'
  if (total < 3600) return `${Math.max(1, Math.round(total / 60))} min`

  const hours = Math.floor(total / 3600)
  const minutes = Math.round((total % 3600) / 60)
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`
}

export function libraryDuration(playlists: Playlist[]): string {
  const total = playlists.reduce(
    (seconds, playlist) =>
      seconds +
      playlist.tracks.reduce((trackSeconds, item) => trackSeconds + parseDuration(item.duration), 0),
    0,
  )
  if (total === 0) return '0m'

  const hours = Math.floor(total / 3600)
  const minutes = Math.round((total % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
