import { isUploadedImageUrl, isUploadedMediaUrl } from '../uploads.ts'
import { MediaError, type MediaSection } from './types.ts'

const SECTION_VALUES: MediaSection[] = ['video', 'music', 'radio']
const TITLE_MAX = 120
const TEXT_MAX = 160
const SHORT_TEXT_MAX = 40
/** Lyrics hold whole songs — room for a long pasted text. */
const LYRICS_MAX = 10000

function cleanSection(raw: unknown): MediaSection {
  if (typeof raw === 'string' && (SECTION_VALUES as string[]).includes(raw)) {
    return raw as MediaSection
  }
  throw new MediaError("Type must be 'video', 'music' or 'radio'.", 400)
}

function cleanTitle(raw: unknown): string {
  const title = typeof raw === 'string' ? raw.trim() : ''
  if (!title) {
    throw new MediaError('A title is required.', 400)
  }
  if (title.length > TITLE_MAX) {
    throw new MediaError(`Title must be ${TITLE_MAX} characters or fewer.`, 400)
  }
  return title
}

/** Optional text: blank (or missing) means the column stays null. */
function cleanText(raw: unknown, label: string, max = TEXT_MAX): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') {
    throw new MediaError(`${label} must be text.`, 400)
  }
  const text = raw.trim()
  if (!text) return null
  if (text.length > max) {
    throw new MediaError(`${label} must be ${max} characters or fewer.`, 400)
  }
  return text
}

/** Optional count: blank (or missing) means the column stays null. */
function cleanCount(raw: unknown, label: string): number | null {
  if (raw === undefined || raw === null) return null
  // Only a number or a string can name a count: `Number(true)` would turn a
  // misplaced boolean into 1, and `Number('   ')` into 0, silently inventing
  // data. Whitespace-only text is just an empty box.
  if (typeof raw !== 'number' && typeof raw !== 'string') {
    throw new MediaError(`${label} must be a whole number between 0 and 2,147,483,647.`, 400)
  }
  if (typeof raw === 'string' && raw.trim() === '') return null
  const value = typeof raw === 'number' ? raw : Number(raw.trim())
  // `count` / `tracks` are Postgres `integer` columns: anything wider passes
  // validation here and then fails at write time as a 500, turning a normal
  // admin typo into a server error.
  if (!Number.isInteger(value) || value < 0 || value > 2_147_483_647) {
    throw new MediaError(`${label} must be a whole number between 0 and 2,147,483,647.`, 400)
  }
  return value
}

/**
 * Optional upload reference. Only files the media uploader stored may be
 * attached — a URL the backend does not serve (or would not delete with the
 * row) has no business on a catalog row.
 */
function cleanSourceUrl(raw: unknown, section: MediaSection): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') {
    throw new MediaError('Source file must be text.', 400)
  }
  const url = raw.trim()
  if (!url) return null
  if (!isUploadedMediaUrl(url)) {
    throw new MediaError('The source file must come from the media uploader.', 400)
  }
  // The hub picks the player by extension: an MP3 attached to a video song
  // (or an MP4 on a music track) would silently render the wrong element.
  if (section === 'radio') {
    throw new MediaError('Radio stations do not carry a media file.', 400)
  }
  const isMp3 = url.toLowerCase().endsWith('.mp3')
  if (section === 'video' && isMp3) {
    throw new MediaError('Video songs need an MP4 source file.', 400)
  }
  if (section === 'music' && !isMp3) {
    throw new MediaError('Music tracks need an MP3 source file.', 400)
  }
  return url
}

/**
 * Optional cover reference. Same rule as `sourceUrl`, tightened to images:
 * an MP4/MP3 in the cover column (or a cover URL in the source column) would
 * survive deletion and break the cleanup guarantee, so neither passes.
 */
function cleanCoverUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') {
    throw new MediaError('Cover image must be text.', 400)
  }
  const url = raw.trim()
  if (!url) return null
  if (!isUploadedImageUrl(url)) {
    throw new MediaError('The cover image must come from the media uploader.', 400)
  }
  return url
}

export interface ValidatedFields {
  section: MediaSection
  title: string
  subtitle: string | null
  artist: string | null
  tag: string | null
  duration: string | null
  plays: number | null
  tempo: string | null
  songKey: string | null
  freq: string | null
  listeners: number | null
  sourceUrl: string | null
  sourceName: string | null
  album: string | null
  lyrics: string | null
  coverUrl: string | null
  coverName: string | null
}

/**
 * Maps a raw body onto the table's columns. One shape for both create and
 * update: the media form always submits the full field set, so an update is
 * a replace — clearing a box clears the column.
 */
export function validateFields(input: Record<string, unknown>): ValidatedFields {
  const section = cleanSection(input.section)
  return {
    section,
    title: cleanTitle(input.title),
    subtitle: cleanText(input.subtitle, 'Subtitle'),
    artist: cleanText(input.artist, 'Artist'),
    tag: cleanText(input.tag, 'Tag', SHORT_TEXT_MAX),
    duration: cleanText(input.duration, 'Duration', SHORT_TEXT_MAX),
    plays: cleanCount(input.plays, 'Plays'),
    tempo: cleanText(input.tempo, 'Tempo', SHORT_TEXT_MAX),
    songKey: cleanText(input.songKey, 'Key', SHORT_TEXT_MAX),
    freq: cleanText(input.freq, 'Frequency', SHORT_TEXT_MAX),
    listeners: cleanCount(input.listeners, 'Listeners'),
    sourceUrl: cleanSourceUrl(input.sourceUrl, section),
    sourceName: cleanText(input.sourceName, 'Source name'),
    album: cleanText(input.album, 'Album'),
    // Lyrics are a music-track field: video/radio rows never store them, and
    // switching a music row's section clears its old text instead of leaving
    // an orphaned staff blob behind.
    lyrics: section === 'music' ? cleanText(input.lyrics, 'Lyrics', LYRICS_MAX) : null,
    coverUrl: cleanCoverUrl(input.coverUrl),
    coverName: cleanText(input.coverName, 'Cover name'),
  }
}
