import { randomUUID } from 'node:crypto'
import { asc, eq, or } from 'drizzle-orm'
import { db } from '../db.ts'
import { mediaItem } from '../schema.ts'
import { isUploadedImageUrl, isUploadedMediaUrl, removeUploadedMedia } from '../uploads.ts'
import { toMediaItem } from './mapping.ts'
import { findMediaById, nextSortOrder } from './queries.ts'
import { MediaError, type MediaItem } from './types.ts'
import { validateFields } from './validation.ts'

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
