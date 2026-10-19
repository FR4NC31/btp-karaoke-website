import { randomUUID } from 'node:crypto'
import { asc, eq, or, sql } from 'drizzle-orm'
import { db } from './db.ts'
import { mediaItem } from './schema.ts'
import { isUploadedImageUrl, isUploadedMediaUrl, removeUploadedMedia } from './uploads.ts'

/**
 * The media hub catalog, on Drizzle.
 *
 * /studio renders three sections — video songs, music (minus-one) tracks and
 * radio stations — from one table. Admins manage rows from /admin/media
 * through /api/admin/media; the public /api/media endpoint serves the active
 * rows only, already section-ordered, and the hub groups them as they come.
 *
 * Nothing here is seeded with mockup copy: the catalog holds what the studio
 * actually publishes. A fresh database starts with the one real local master
 * ("The Reason" — frontend/src/assets/video_local/the-reason.mp4); everything
 * else arrives through the admin console, files included: video songs and
 * music tracks can carry an uploaded MP4/MP3 (`sourceUrl`, stored under
 * backend/uploads by src/uploads.ts) plus a cover image (`coverUrl`) —
 * extracted from the file's own tags, grabbed from the video, or picked by
 * the admin. Artist names (`artist`) and albums (`album`) ride those same
 * file tags. Removing either file from a row — replace or delete — removes
 * the stored upload with it.
 */

export type MediaSection = 'video' | 'music' | 'radio'

export interface MediaItem {
  id: string
  section: MediaSection
  title: string
  subtitle: string | null
  /** Performer — the file's artist tag or the admin's copy; null hides the line. */
  artist: string | null
  tag: string | null
  duration: string | null
  plays: number | null
  tempo: string | null
  songKey: string | null
  freq: string | null
  listeners: number | null
  /** Uploaded MP4/MP3 this row plays; null = bundled master (video) / none (music). */
  sourceUrl: string | null
  /** Original filename of the upload — admin display only. */
  sourceName: string | null
  /** Album/collection as shown on the hub, or null to hide it. */
  album: string | null
  /**
   * Optional track lyrics — multi-line plain text typed or pasted in the
   * admin editor (music rows). Null when the admin wrote none.
   */
  lyrics: string | null
  /** Uploaded cover image shown on the card/stage; null = default art. */
  coverUrl: string | null
  /** Original filename of the cover upload — admin display only. */
  coverName: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * The public hub payload — no admin bookkeeping fields, and no lyrics: the
 * text is staff-only (the admin editor and console read it through
 * /api/admin/media), so an unauthenticated /api/media read cannot scrape it.
 */
export type PublicMediaItem = Omit<
  MediaItem,
  'isActive' | 'createdAt' | 'updatedAt' | 'sourceName' | 'coverName' | 'lyrics'
>

/** Thrown for anything the route should turn into a specific HTTP status. */
export class MediaError extends Error {
  readonly status: 400 | 404

  constructor(message: string, status: 400 | 404) {
    super(message)
    this.name = 'MediaError'
    this.status = status
  }
}

const SECTION_VALUES: MediaSection[] = ['video', 'music', 'radio']
const TITLE_MAX = 120
const TEXT_MAX = 160
const SHORT_TEXT_MAX = 40
/** Lyrics hold whole songs — room for a long pasted text. */
const LYRICS_MAX = 10000

type MediaRow = typeof mediaItem.$inferSelect

function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    section: row.section as MediaSection,
    title: row.title,
    subtitle: row.subtitle,
    artist: row.artist,
    tag: row.tag,
    duration: row.duration,
    plays: row.plays,
    tempo: row.tempo,
    songKey: row.songKey,
    freq: row.freq,
    listeners: row.listeners,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    album: row.album,
    lyrics: row.lyrics,
    coverUrl: row.coverUrl,
    coverName: row.coverName,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toPublicMediaItem(item: MediaItem): PublicMediaItem {
  return {
    id: item.id,
    section: item.section,
    title: item.title,
    subtitle: item.subtitle,
    artist: item.artist,
    tag: item.tag,
    duration: item.duration,
    plays: item.plays,
    tempo: item.tempo,
    songKey: item.songKey,
    freq: item.freq,
    listeners: item.listeners,
    sourceUrl: item.sourceUrl,
    album: item.album,
    coverUrl: item.coverUrl,
    sortOrder: item.sortOrder,
  }
}

/**
 * Section order for every list: video → music → radio, the order the hub
 * renders. Inside a section, sortOrder (ties by title) — exactly what the
 * admin's move-up/move-down buttons reorder.
 */
const SECTION_ORDER = sql`case ${mediaItem.section} when 'video' then 0 when 'music' then 1 else 2 end`

/** Active catalog for the public hub, section-ordered. */
export async function listPublicMedia(): Promise<PublicMediaItem[]> {
  const rows = await db
    .select()
    .from(mediaItem)
    .where(eq(mediaItem.isActive, true))
    .orderBy(SECTION_ORDER, asc(mediaItem.sortOrder), asc(mediaItem.title))

  return rows.map((row) => toPublicMediaItem(toMediaItem(row)))
}

/** Full catalog for the admin console — hidden rows included. */
export async function listMediaForAdmin(section?: MediaSection): Promise<MediaItem[]> {
  const rows = await db
    .select()
    .from(mediaItem)
    .where(section ? eq(mediaItem.section, section) : undefined)
    .orderBy(SECTION_ORDER, asc(mediaItem.sortOrder), asc(mediaItem.title))

  return rows.map(toMediaItem)
}

async function findMediaById(id: string): Promise<MediaItem | null> {
  const rows = await db.select().from(mediaItem).where(eq(mediaItem.id, id)).limit(1)
  const row = rows[0]
  return row ? toMediaItem(row) : null
}

// ---------------------------------------------------------------------------
// Validation
//
// Every write goes through these, so the route handlers can hand the raw JSON
// body over and only translate MediaError into a status code.
// ---------------------------------------------------------------------------

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
  if (raw === undefined || raw === null || raw === '') return null
  const value = typeof raw === 'number' ? raw : Number(raw)
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
function cleanSourceUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') {
    throw new MediaError('Source file must be text.', 400)
  }
  const url = raw.trim()
  if (!url) return null
  if (!isUploadedMediaUrl(url)) {
    throw new MediaError('The source file must come from the media uploader.', 400)
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

interface ValidatedFields {
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
function validateFields(input: Record<string, unknown>): ValidatedFields {
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
    sourceUrl: cleanSourceUrl(input.sourceUrl),
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

/** Next display slot inside a section, so new rows append at the bottom. */
async function nextSortOrder(section: MediaSection): Promise<number> {
  const rows = await db
    .select({ max: sql<number | null>`max(${mediaItem.sortOrder})` })
    .from(mediaItem)
    .where(eq(mediaItem.section, section))
  return (rows[0]?.max ?? 0) + 1
}

// ---------------------------------------------------------------------------
// Admin operations
//
// All of these sit behind `requireAdmin` (src/index.ts mounts them on the
// admin sub-app, which registers the middleware once on its root).
// ---------------------------------------------------------------------------

/**
 * Adds one catalog row, created active and appended to its section. The
 * route hands this the parsed JSON body; field validation lives in
 * validateFields, so bad input is a 400 with a specific message.
 */
export async function createMediaItem(input: Record<string, unknown>): Promise<MediaItem> {
  const fields = validateFields(input)

  const inserted = await db
    .insert(mediaItem)
    .values({
      id: randomUUID(),
      ...fields,
      sortOrder: await nextSortOrder(fields.section),
      isActive: true,
    })
    .returning()

  const row = inserted[0]
  if (!row) {
    throw new MediaError('The media item could not be saved.', 400)
  }
  return toMediaItem(row)
}

/**
 * Replaces one catalog row's editable fields. Section can change; the row
 * keeps its sortOrder (ordering inside the new section falls back to title
 * until the admin reorders). Replacing or clearing the row's uploaded media
 * or cover removes the old uploads from disk.
 */
export async function updateMediaItem(
  id: string,
  input: Record<string, unknown>,
): Promise<MediaItem> {
  const existing = await findMediaById(id)
  if (!existing) {
    throw new MediaError('That media item does not exist.', 404)
  }

  const fields = validateFields(input)

  const updated = await db
    .update(mediaItem)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(mediaItem.id, id))
    .returning()

  const row = updated[0]
  if (!row) {
    throw new MediaError('That media item does not exist.', 404)
  }

  if (existing.sourceUrl && existing.sourceUrl !== row.sourceUrl) {
    await removeUploadedMedia(existing.sourceUrl)
  }
  if (existing.coverUrl && existing.coverUrl !== row.coverUrl) {
    await removeUploadedMedia(existing.coverUrl)
  }
  return toMediaItem(row)
}

/** Hides or shows a row. Hidden rows leave /api/media but stay manageable. */
export async function setMediaVisibility(id: string, isActive: unknown): Promise<MediaItem> {
  if (typeof isActive !== 'boolean') {
    throw new MediaError('isActive must be true or false.', 400)
  }

  const updated = await db
    .update(mediaItem)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(mediaItem.id, id))
    .returning()

  const row = updated[0]
  if (!row) {
    throw new MediaError('That media item does not exist.', 404)
  }
  return toMediaItem(row)
}

export type MoveDirection = 'up' | 'down'

/**
 * Swaps a row with its neighbour inside its section — the move-up /
 * move-down buttons. At the edge of the list this is a no-op that returns
 * the row as-is, so a stale button never errors.
 */
export async function moveMediaItem(id: string, direction: unknown): Promise<MediaItem> {
  if (direction !== 'up' && direction !== 'down') {
    throw new MediaError("Direction must be 'up' or 'down'.", 400)
  }

  const item = await findMediaById(id)
  if (!item) {
    throw new MediaError('That media item does not exist.', 404)
  }

  const siblings = await db
    .select({ id: mediaItem.id, sortOrder: mediaItem.sortOrder })
    .from(mediaItem)
    .where(eq(mediaItem.section, item.section))
    .orderBy(asc(mediaItem.sortOrder), asc(mediaItem.title))

  const index = siblings.findIndex((sibling) => sibling.id === id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1

  if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length) {
    return item
  }

  const other = siblings[targetIndex]
  if (!other) return item

  if (item.sortOrder === other.sortOrder) {
    // Sort-order ties (only reachable by editing rows outside the console):
    // rewrite the section's order canonically, with the swap applied.
    const ids = siblings.map((sibling) => sibling.id)
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!]
    for (let position = 0; position < ids.length; position++) {
      await db
        .update(mediaItem)
        .set({ sortOrder: position + 1, updatedAt: new Date() })
        .where(eq(mediaItem.id, ids[position]!))
    }
  } else {
    // Normal case: exchange the two rows' slots.
    await db
      .update(mediaItem)
      .set({ sortOrder: other.sortOrder, updatedAt: new Date() })
      .where(eq(mediaItem.id, id))
    await db
      .update(mediaItem)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(mediaItem.id, other.id))
  }

  const result = await findMediaById(id)
  if (!result) {
    throw new MediaError('The media item could not be read back after moving.', 400)
  }
  return result
}

/**
 * Permanent removal. Prefer `setMediaVisibility(false)` when the row should
 * merely leave the hub — delete is for rows that were a mistake. The row's
 * uploaded media and cover go with it (best-effort).
 */
export async function deleteMediaItem(id: string): Promise<MediaItem> {
  const removed = await db.delete(mediaItem).where(eq(mediaItem.id, id)).returning()

  const row = removed[0]
  if (!row) {
    throw new MediaError('That media item does not exist.', 404)
  }
  await Promise.all([removeUploadedMedia(row.sourceUrl), removeUploadedMedia(row.coverUrl)])
  return toMediaItem(row)
}

/**
 * Removes one upload that no catalog row references — the editor's cleanup
 * when a save failed after it had already uploaded a file. A URL some row
 * still references is left alone: a lost response must never delete a file
 * the hub still plays. Best-effort delete, like every other cleanup path.
 */
export async function discardUpload(url: unknown): Promise<void> {
  if (typeof url !== 'string') {
    throw new MediaError('The upload URL must be text.', 400)
  }
  const trimmed = url.trim()
  if (!isUploadedMediaUrl(trimmed) && !isUploadedImageUrl(trimmed)) {
    throw new MediaError('That upload is not ours to discard.', 400)
  }

  const referenced = await db
    .select({ id: mediaItem.id })
    .from(mediaItem)
    .where(or(eq(mediaItem.sourceUrl, trimmed), eq(mediaItem.coverUrl, trimmed)))
    .limit(1)

  if (referenced.length > 0) return
  await removeUploadedMedia(trimmed)
}
