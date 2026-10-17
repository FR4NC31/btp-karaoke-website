export interface SidebarItem {
  name: string
  count: string
}

export interface SidebarSection {
  label: string
  items: SidebarItem[]
}

export const sidebarSections: SidebarSection[] = [
  {
    label: 'Production Archives',
    items: [
      { name: 'Master Collections Vault', count: '84' },
      { name: 'Minus-Ones (Clean Instrumental)', count: '112' },
      { name: 'Stem Multitracks (Vocals/Beds)', count: '268' },
      { name: 'FILSCAP Heritage OPM Series', count: '60.0' },
    ],
  },
  {
    label: 'Live Setlists & Sessions',
    items: [
      { name: 'Acoustic Lounge Live Set 2025', count: '54' },
      { name: 'Pinoy Rock Rehearsal (Drop D)', count: '72' },
      { name: 'Duet Sing-Along Gold Vault', count: '38' },
      { name: 'Late Night Studio Sessions', count: '38' },
    ],
  },
]

export interface StudioTool {
  code: string
  name: string
  desc: string
}

export const studioTools: StudioTool[] = [
  { code: 'Vocal A', name: 'Vocal Tuner', desc: 'Pitch & Formant' },
  { code: 'Banjo B', name: 'Minus-I Split', desc: 'StemExtractor' },
]

export interface MusicTrack {
  tag: string
  title: string
  subtitle: string
  tempo: string
  key: string
}

/** Audio songs (minus-one sets) for the Music Player card grid. */
export const musicTracks: MusicTrack[] = [
  { tag: 'MIX', title: 'Afternoon Drive', subtitle: 'Mastered by Frankie Dev', tempo: '118 BPM', key: 'Fmaj' },
  { tag: 'VAULT', title: 'Strict Minus-One Kit', subtitle: 'BTP Production Originals', tempo: '124 BPM', key: 'Amin' },
  { tag: 'LIVE', title: 'Pivot Rhythm Anthems Vol.', subtitle: 'Glass Avenue FH Archive', tempo: '132 BPM', key: 'Gmaj' },
  { tag: 'TAPE', title: 'OPM Classics & Golden Eras', subtitle: 'BTP Production Master Tape', tempo: '96 BPM', key: 'Cmaj' },
  { tag: 'MIX', title: 'Soft Acoustic & Chill', subtitle: 'Acoustic Room Sessions', tempo: '72 BPM', key: 'Dmin' },
]

export interface VideoSong {
  tag: string
  title: string
  subtitle: string
  duration: string
  plays: string
}

/**
 * Karaoke video songs for the Video Song card grid. Every card opens the
 * player-queue console; the one local video master ("The Reason") plays
 * through the shell player bar there.
 */
export const videoSongs: VideoSong[] = [
  { tag: 'KTV', title: 'The Reason', subtitle: 'Hoobastank', duration: '03:54', plays: '12.4K' },
  { tag: 'DUET', title: 'Die With A Smile (Cover)', subtitle: 'Lady Gaga & Bruno Mars', duration: '04:11', plays: '8.1K' },
  { tag: 'POP', title: 'APT.', subtitle: 'ROSÉ & Bruno Mars', duration: '02:49', plays: '9.6K' },
  { tag: 'OPM', title: 'Kisapmata', subtitle: 'Rivermaya', duration: '04:32', plays: '5.2K' },
]

export interface RadioStation {
  name: string
  genre: string
  freq: string
  listeners: string
}

export const radioStations: RadioStation[] = [
  { name: 'BTP Lounge Radio', genre: 'OPM & Lounge', freq: 'FM 91.5', listeners: '1,204' },
  { name: 'OPM Gold FM', genre: 'Classic OPM', freq: 'FM 98.7', listeners: '892' },
  { name: 'Pinoy Rock Wave', genre: 'Rock', freq: 'FM 105.3', listeners: '654' },
  { name: 'Acoustic Chill FM', genre: 'Acoustic', freq: 'AM 720', listeners: '431' },
]
