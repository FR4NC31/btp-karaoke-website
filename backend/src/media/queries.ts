import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../db.ts'
import { mediaItem } from '../schema.ts'
import { toMediaItem, toPublicMediaItem } from './mapping.ts'
import type { MediaItem, MediaSection, PublicMediaItem } from './types.ts'

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
