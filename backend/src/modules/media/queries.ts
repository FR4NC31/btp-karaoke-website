import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { mediaItem } from '../../db/schema.ts'
import { cacheDel, cacheDelPrefix, cacheGet, cacheSet } from '../../shared/cache.ts'
import { toMediaItem, toPublicMediaItem } from './mapping.ts'
import type { MediaItem, MediaSection, PublicMediaItem } from './types.ts'

/**
 * Section order for every list: video → music → radio, the order the hub
 * renders. Inside a section, sortOrder (ties by title) — exactly what the
 * admin's move-up/move-down buttons reorder.
 */
const SECTION_ORDER = sql`case ${mediaItem.section} when 'video' then 0 when 'music' then 1 else 2 end`

const PUBLIC_MEDIA_KEY = 'media:public'
const PUBLIC_MEDIA_TTL = 60

/** Active catalog for the public hub, section-ordered. */
export async function listPublicMedia(): Promise<PublicMediaItem[]> {
  const cached = await cacheGet<PublicMediaItem[]>(PUBLIC_MEDIA_KEY)
  if (cached) return cached

  const rows = await db
    .select()
    .from(mediaItem)
    .where(eq(mediaItem.isActive, true))
    .orderBy(SECTION_ORDER, asc(mediaItem.sortOrder), asc(mediaItem.title))

  const value = rows.map((row) => toPublicMediaItem(toMediaItem(row)))
  await cacheSet(PUBLIC_MEDIA_KEY, value, PUBLIC_MEDIA_TTL)
  return value
}

const ADMIN_MEDIA_PREFIX = 'media:admin:'

/** Full catalog for the admin console — hidden rows included. */
export async function listMediaForAdmin(section?: MediaSection): Promise<MediaItem[]> {
  const key = `${ADMIN_MEDIA_PREFIX}${section ?? 'all'}`
  const cached = await cacheGet<MediaItem[]>(key)
  if (cached) return cached

  const rows = await db
    .select()
    .from(mediaItem)
    .where(section ? eq(mediaItem.section, section) : undefined)
    .orderBy(SECTION_ORDER, asc(mediaItem.sortOrder), asc(mediaItem.title))

  const value = rows.map(toMediaItem)
  await cacheSet(key, value, 30)
  return value
}

/** Drop all cached media entries (call after any media mutation). */
export async function invalidateMediaCache(): Promise<void> {
  await cacheDelPrefix('media:')
}

