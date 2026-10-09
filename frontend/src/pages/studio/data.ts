export interface SidebarItem {
  name: string
  count: string
}

export interface SidebarSection {
  label: string
  items: SidebarItem[]
}

export interface Collection {
  title: string
  desc: string
  bpm: string
  key: string
  tag: string
  genre: string
}

export interface Track {
  no: string
  title: string
  artist: string
  fmt: string
  date: string
  key: string
  tempo: string
  len: string
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

export const filterGenres = [
  'All Genres',
  'Pop',
  'Rock',
  'R&B',
  'Hip-Hop',
  'Ballad',
  'Acoustic',
]

export const collections: Collection[] = [
  { title: 'Afternoon Drive', desc: 'Mastered by Frankie Dev', bpm: '118 BPM', key: 'Fmaj', tag: 'Mix', genre: 'Pop' },
  { title: 'Strict Minus-One Kit', desc: 'BTP Production Originals', bpm: '124 BPM', key: 'Amin', tag: 'Vault', genre: 'Hip-Hop' },
  { title: 'Pivot Rhythm Anthems Vol.', desc: 'Glass Avenue FH Archive', bpm: '132 BPM', key: 'Gmaj', tag: 'Live', genre: 'Rock' },
  { title: 'Opn Classics & Golden Eras', desc: 'BTP Production Master Tape', bpm: '96 BPM', key: 'Cmaj', tag: 'Tape', genre: 'R&B' },
  { title: 'Soft Acoustic & Chill', desc: 'Acoustic Room Sessions', bpm: '72 BPM', key: 'Dmin', tag: 'Mix', genre: 'Acoustic' },
  { title: 'Midnight Serenade', desc: 'BTP Ballad Selections', bpm: '68 BPM', key: 'Bmin', tag: 'Mix', genre: 'Ballad' },
]

export const telemetry: Track[] = [
  { no: '01', title: 'Die With A Smile (Cover)', artist: 'Lady Gaga & Bruno Mars', fmt: 'WAV 24-bit', date: '2025-08-12', key: 'C Maj', tempo: '104 BPM', len: '4:11' },
  { no: '02', title: 'Afternoon Drive', artist: 'Frankie Dev', fmt: 'FLAC 16-bit', date: '2025-08-10', key: 'F Maj', tempo: '118 BPM', len: '3:44' },
  { no: '03', title: 'Pivot Drill Selection', artist: 'Glass Avenue FH', fmt: 'WAV 24-bit', date: '2025-08-09', key: 'G Min', tempo: '132 BPM', len: '2:58' },
  { no: '04', title: 'Strict Minus-One Kit', artist: 'BTP Production', fmt: 'FLAC 16-bit', date: '2025-08-05', key: 'A Min', tempo: '124 BPM', len: '5:02' },
  { no: '05', title: 'Acoustic Lounge Live', artist: 'BTP Sessions', fmt: 'WAV 24-bit', date: '2025-08-01', key: 'D Maj', tempo: '88 BPM', len: '6:21' },
]
