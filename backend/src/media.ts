/**
 * The media hub catalog, on Drizzle.
 *
 * /studio renders three sections — video songs, music (minus-one) tracks and
 * radio stations — from one table. Admins manage rows from /admin/media
 * through /api/admin/media; the public /api/media endpoint serves the active
 * rows only, already section-ordered, and the hub groups them as they come.
 *
 * Nothing here is seeded with mockup copy: the catalog holds what the studio
 * actually publishes. Uploaded files live under backend/uploads (src/uploads.ts);
 * removing either file from a row — replace or delete — removes the stored
 * upload with it.
 *
 * This file is the public barrel; the implementation lives in src/media/.
 */

export { MediaError, type MediaItem, type MediaSection, type PublicMediaItem } from './media/types.ts'
export { invalidateMediaCache, listMediaForAdmin, listPublicMedia } from './media/queries.ts'
export {
  createMediaItem,
  deleteMediaItem,
  discardUpload,
  moveMediaItem,
  setMediaVisibility,
  updateMediaItem,
} from './media/admin.ts'
