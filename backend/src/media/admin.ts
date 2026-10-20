import { randomUUID } from 'node:crypto'
import { asc, eq, or, sql } from 'drizzle-orm'
import { db } from '../db.ts'
import { mediaItem } from '../schema.ts'
import {
  isUploadedImageUrl,
  isUploadedMediaUrl,
  removeUploadedMedia,
  uploadedMediaOnDisk,
} from '../uploads.ts'
import { toMediaItem } from './mapping.ts'
import { MediaError, type MediaItem } from './types.ts'
import { validateFields } from './validation.ts'

/** The connection a `db.transaction` callback hands us. */
type MediaTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Every catalog write that can touch uploads runs inside one transaction that
 * first takes this advisory lock. Without it, `discardUpload` can check "no
 * row references this file" and delete it while a create/update is between
 * its own check and its INSERT/UPDATE — leaving a row pointed at a deleted
 * file. The lock serializes those critical sections across processes (an
 * in-memory mutex would only cover one backend). Cleanup is rare and the
 * catalog is small, so a single lock is cheaper than a per-URL scheme.
 */
async function lockMediaCatalog(tx: MediaTx): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('btp.media.catalog'))`)
}

/** A row read on the transaction's connection, shaped like every other query. */
async function findMediaRow(tx: MediaTx, id: string): Promise<MediaItem | null> {
  const rows = await tx.select().from(mediaItem).where(eq(mediaItem.id, id)).limit(1)
  const row = rows[0]
  return row ? toMediaItem(row) : null
}

/** True when any remaining row still plays or shows this upload. */
async function uploadIsReferenced(tx: MediaTx, url: string): Promise<boolean> {
  const rows = await tx
    .select({ id: mediaItem.id })
    .from(mediaItem)
    .where(or(eq(mediaItem.sourceUrl, url), eq(mediaItem.coverUrl, url)))
    .limit(1)
  return rows.length > 0
}

/**
 * A URL being attached must still exist on disk. Together with the catalog
 * lock this makes the save/discard race deterministic: whichever transaction
 * gets the lock first wins, and a save that follows a discard is rejected
 * with a 400 instead of writing a row that points at a deleted file.
 */
async function assertUploadsExist(urls: Array<string | null>): Promise<void> {
  for (const url of new Set(urls.filter((value): value is string => Boolean(value)))) {
    if (!(await uploadedMediaOnDisk(url))) {
      throw new MediaError('That uploaded file no longer exists. Upload it again.', 400)
    }
  }
}

/** Deletes only the files no remaining row references. Runs under the lock. */
async function removeUnreferencedUploads(
  tx: MediaTx,
  urls: Array<string | null>,
): Promise<void> {
  for (const url of new Set(urls.filter((value): value is string => Boolean(value)))) {
    if (!(await uploadIsReferenced(tx, url))) {
      await removeUploadedMedia(url)
    }
  }
}

/**
 * Adds one catalog row, created active and appended to its section. The
 * route hands this the parsed JSON body; field validation lives in
 * validateFields, so bad input is a 400 with a specific message.
 */
export async function createMediaItem(input: Record<string, unknown>): Promise<MediaItem> {
  const fields = validateFields(input)

  return db.transaction(async (tx) => {
    await lockMediaCatalog(tx)
    await assertUploadsExist([fields.sourceUrl, fields.coverUrl])

    const orderRows = await tx
      .select({ max: sql<number | null>`max(${mediaItem.sortOrder})` })
      .from(mediaItem)
      .where(eq(mediaItem.section, fields.section))
    const sortOrder = (orderRows[0]?.max ?? 0) + 1

    const inserted = await tx
      .insert(mediaItem)
      .values({
        id: randomUUID(),
        ...fields,
        sortOrder,
        isActive: true,
      })
      .returning()

    const row = inserted[0]
    if (!row) {
      throw new MediaError('The media item could not be saved.', 400)
    }
    return toMediaItem(row)
  })
}

/**
 * Replaces one catalog row's editable fields. Section can change; the row
 * keeps its sortOrder (ordering inside the new section falls back to title
 * until the admin reorders). Replacing or clearing the row's uploaded media
 * or cover removes the old uploads from disk — unless another row still
 * references the same URL.
 */
export async function updateMediaItem(
  id: string,
  input: Record<string, unknown>,
): Promise<MediaItem> {
  const fields = validateFields(input)

  return db.transaction(async (tx) => {
    await lockMediaCatalog(tx)

    const existing = await findMediaRow(tx, id)
    if (!existing) {
      throw new MediaError('That media item does not exist.', 404)
    }

    // Only URLs that are actually changing need to exist: an already-broken
    // row stays editable (the admin can replace or clear the missing file).
    await assertUploadsExist([
      fields.sourceUrl !== existing.sourceUrl ? fields.sourceUrl : null,
      fields.coverUrl !== existing.coverUrl ? fields.coverUrl : null,
    ])

    const updated = await tx
      .update(mediaItem)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(mediaItem.id, id))
      .returning()

    const row = updated[0]
    if (!row) {
      throw new MediaError('That media item does not exist.', 404)
    }

    await removeUnreferencedUploads(tx, [
      existing.sourceUrl !== row.sourceUrl ? existing.sourceUrl : null,
      existing.coverUrl !== row.coverUrl ? existing.coverUrl : null,
    ])
    return toMediaItem(row)
  })
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

/**
 * Swaps a row with its neighbour inside its section — the move-up /
 * move-down buttons. At the edge of the list this is a no-op that returns
 * the row as-is, so a stale button never errors. The swap runs in one
 * transaction so a failure cannot leave both rows on the same slot.
 */
export async function moveMediaItem(id: string, direction: unknown): Promise<MediaItem> {
  if (direction !== 'up' && direction !== 'down') {
    throw new MediaError("Direction must be 'up' or 'down'.", 400)
  }

  return db.transaction(async (tx) => {
    await lockMediaCatalog(tx)

    const item = await findMediaRow(tx, id)
    if (!item) {
      throw new MediaError('That media item does not exist.', 404)
    }

    const siblings = await tx
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

    const now = new Date()
    if (item.sortOrder === other.sortOrder) {
      // Sort-order ties (only reachable by editing rows outside the console):
      // rewrite the section's order canonically, with the swap applied.
      const ids = siblings.map((sibling) => sibling.id)
      ;[ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!]
      for (let position = 0; position < ids.length; position++) {
        await tx
          .update(mediaItem)
          .set({ sortOrder: position + 1, updatedAt: now })
          .where(eq(mediaItem.id, ids[position]!))
      }
    } else {
      // Normal case: exchange the two rows' slots.
      await tx
        .update(mediaItem)
        .set({ sortOrder: other.sortOrder, updatedAt: now })
        .where(eq(mediaItem.id, id))
      await tx
        .update(mediaItem)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(mediaItem.id, other.id))
    }

    const result = await findMediaRow(tx, id)
    if (!result) {
      throw new MediaError('The media item could not be read back after moving.', 400)
    }
    return result
  })
}

/**
 * Permanent removal. Prefer `setMediaVisibility(false)` when the row should
 * merely leave the hub — delete is for rows that were a mistake. The row's
 * uploaded media and cover go with it (best-effort), unless a shared URL is
 * still referenced by another row.
 */
export async function deleteMediaItem(id: string): Promise<MediaItem> {
  return db.transaction(async (tx) => {
    await lockMediaCatalog(tx)

    const removed = await tx.delete(mediaItem).where(eq(mediaItem.id, id)).returning()

    const row = removed[0]
    if (!row) {
      throw new MediaError('That media item does not exist.', 404)
    }
    await removeUnreferencedUploads(tx, [row.sourceUrl, row.coverUrl])
    return toMediaItem(row)
  })
}

/**
 * Removes one upload that no catalog row references — the editor's cleanup
 * when a save failed after it had already uploaded a file. A URL some row
 * still references is left alone: a lost response must never delete a file
 * the hub still plays. The check and the delete share the catalog lock, so a
 * concurrent save cannot attach the file in between.
 */
export async function discardUpload(url: unknown): Promise<void> {
  if (typeof url !== 'string') {
    throw new MediaError('The upload URL must be text.', 400)
  }
  const trimmed = url.trim()
  if (!isUploadedMediaUrl(trimmed) && !isUploadedImageUrl(trimmed)) {
    throw new MediaError('That upload is not ours to discard.', 400)
  }

  await db.transaction(async (tx) => {
    await lockMediaCatalog(tx)
    if (await uploadIsReferenced(tx, trimmed)) return
    await removeUploadedMedia(trimmed)
  })
}
