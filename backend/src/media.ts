import { randomUUID } from 'node:crypto'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from './db.ts'
import { mediaItem } from './schema.ts'

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
 * else arrives through the admin console.
 */

export type MediaSection = 'video' | 'music' | 'radio'

export interface MediaItem {
  id: string
  section: MediaSection
  title: string
  subtitle: string | null
  tag: string | null
  duration: string | null
  plays: number | null
  tempo: string | null
  songKey: string | null
  freq: string | null
  listeners: number | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** The public hub payload — no admin bookkeeping fields. */
export type PublicMediaItem = Omit<MediaItem, 'isActive' | 'createdAt' | 'updatedAt'>

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

type MediaRow = typeof mediaItem.$inferSelect

function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    section: row.section as MediaSection,
    title: row.title,
    subtitle: row.subtitle,
    tag: row.tag,
    duration: row.duration,
    plays: row.plays,
    tempo: row.tempo,
    songKey: row.songKey,
    freq: row.freq,
    listeners: row.listeners,
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
    tag: item.tag,
    duration: item.duration,
    plays: item.plays,
    tempo: item.tempo,
    songKey: item.songKey,
    freq: item.freq,
    listeners: item.listeners,
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
  if (!Number.isInteger(value) || value < 0) {
    throw new MediaError(`${label} must be a whole, non-negative number.`, 400)
  }
  return value
}

interface ValidatedFields {
  section: MediaSection
  title: string
  subtitle: string | null
  tag: string | null
  duration: string | null
  plays: number | null
  tempo: string | null
  songKey: string | null
  freq: string | null
  listeners: number | null
}

/**
 * Maps a raw body onto the table's columns. One shape for both create and
 * update: the media form always submits the full field set, so an update is
 * a replace — clearing a box clears the column.
 */
function validateFields(input: Record<string, unknown>): ValidatedFields {
  return {
    section: cleanSection(input.section),
    title: cleanTitle(input.title),
    subtitle: cleanText(input.subtitle, 'Subtitle'),
    tag: cleanText(input.tag, 'Tag', SHORT_TEXT_MAX),
    duration: cleanText(input.duration, 'Duration', SHORT_TEXT_MAX),
    plays: cleanCount(input.plays, 'Plays'),
    tempo: cleanText(input.tempo, 'Tempo', SHORT_TEXT_MAX),
    songKey: cleanText(input.songKey, 'Key', SHORT_TEXT_MAX),
    freq: cleanText(input.freq, 'Frequency', SHORT_TEXT_MAX),
    listeners: cleanCount(input.listeners, 'Listeners'),
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
 * until the admin reorders).
 */
export async function updateMediaItem(
  id: string,
  input: Record<string, unknown>,
): Promise<MediaItem> {
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
 * merely leave the hub — delete is for rows that were a mistake.
 */
export async function deleteMediaItem(id: string): Promise<MediaItem> {
  const removed = await db.delete(mediaItem).where(eq(mediaItem.id, id)).returning()

  const row = removed[0]
  if (!row) {
    throw new MediaError('That media item does not exist.', 404)
  }
  return toMediaItem(row)
}
