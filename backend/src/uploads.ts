import { createWriteStream } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { extname, join, resolve } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/**
 * Uploaded files behind the media hub: the playable media (MP4 video / MP3
 * audio) and their cover art / thumbnails (JPG / PNG / WebP images).
 *
 * Storage is the local disk — one directory next to the backend process
 * (UPLOADS_DIR, default ./uploads) — served back through
 * GET /api/uploads/media/:name with byte-range support, so an uploaded video
 * seeks in the console exactly like the bundled master. Deliberately small:
 * this project stores only what the studio actually publishes.
 *
 * Files are named `<uuid>.<ext>` — the original filename is kept as display
 * copy (the row's `sourceName` / `coverName`), never as a path. Deleting a
 * catalog row (or replacing its file) removes the old uploads; that cleanup
 * is best-effort, so a stray file can never fail an API call.
 */

/** Where uploads live. The default resolves against the server cwd (backend/). */
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? resolve(process.env.UPLOADS_DIR)
  : resolve(process.cwd(), 'uploads')

/** Public base path uploads are served from (proxied like the rest of /api). */
export const MEDIA_UPLOAD_BASE = '/api/uploads/media'

const maxMb = Number(process.env.MEDIA_UPLOAD_MAX_MB)

/** Upload ceiling, default 200 MB — override with MEDIA_UPLOAD_MAX_MB. */
export const MEDIA_UPLOAD_MAX_BYTES =
  (Number.isFinite(maxMb) && maxMb > 0 ? maxMb : 200) * 1024 * 1024

/** The only extensions the uploader accepts: playable media + cover images. */
const ALLOWED_EXTENSIONS = ['.mp4', '.mp3', '.jpg', '.jpeg', '.png', '.webp']

/** MIME family each accepted extension belongs to — a declared type must match it. */
const CONTENT_FAMILIES: Record<string, string> = {
  '.mp4': 'video/',
  '.mp3': 'audio/',
  '.jpg': 'image/',
  '.jpeg': 'image/',
  '.png': 'image/',
  '.webp': 'image/',
}

/** Names this module generates — safe to join onto the uploads directory. */
const FILE_NAME_PATTERN = /^[A-Za-z0-9_-]+\.(?:mp4|mp3|jpe?g|png|webp)$/

/** Any stored upload URL, for the delete/replace cleanup path. */
const ANY_UPLOAD_URL_PATTERN = /^\/api\/uploads\/media\/([A-Za-z0-9_-]+\.(?:mp4|mp3|jpe?g|png|webp))$/

/** Playable media only — what a catalog row's `sourceUrl` may carry. */
const MEDIA_URL_PATTERN = /^\/api\/uploads\/media\/[A-Za-z0-9_-]+\.(?:mp4|mp3)$/

/** Cover images only — what a catalog row's `coverUrl` may carry. */
const IMAGE_URL_PATTERN = /^\/api\/uploads\/media\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/

/** Thrown for anything the routes should turn into a specific HTTP status. */
export class UploadError extends Error {
  readonly status: 400 | 413 | 500

  constructor(message: string, status: 400 | 413 | 500 = 400) {
    super(message)
    this.name = 'UploadError'
    this.status = status
  }
}

/** What a stored upload answers with: URL to save on the row + display copy. */
export interface StoredUpload {
  url: string
  name: string
  size: number
}

export function isUploadedMediaUrl(url: string): boolean {
  return MEDIA_URL_PATTERN.test(url)
}

export function isUploadedImageUrl(url: string): boolean {
  return IMAGE_URL_PATTERN.test(url)
}

export function isUploadedMediaName(name: string): boolean {
  return FILE_NAME_PATTERN.test(name)
}

/** Absolute path for a served upload name, or null when the name is not ours. */
export function mediaFilePath(name: string): string | null {
  return isUploadedMediaName(name) ? join(UPLOADS_DIR, 'media', name) : null
}

/** True when the file behind a stored upload URL is still on disk. */
export async function uploadedMediaOnDisk(url: string): Promise<boolean> {
  const match = ANY_UPLOAD_URL_PATTERN.exec(url)
  const name = match?.[1]
  if (!name) return false
  try {
    const info = await stat(join(UPLOADS_DIR, 'media', name))
    return info.isFile()
  } catch {
    return false
  }
}

/** Response content type for a stored upload. */
export function mediaContentType(name: string): string {
  if (name.endsWith('.mp3')) return 'audio/mpeg'
  if (name.endsWith('.mp4')) return 'video/mp4'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function friendlyMaxSize(): string {
  return `${Math.round(MEDIA_UPLOAD_MAX_BYTES / (1024 * 1024))} MB`
}

/**
 * Streams one upload to disk and returns its public reference. The body is
 * raw binary (the editor posts the File itself with X-File-Name), so large
 * videos never sit in memory: bytes are counted as they flow and the request
 * is aborted the moment the ceiling is crossed.
 */
export async function storeMediaUpload(input: {
  originalName: string
  contentType: string
  contentLength: string | undefined
  body: ReadableStream<Uint8Array> | null
}): Promise<StoredUpload> {
  // Split on both separators: the backend may run on Windows or Linux.
  const displayName = input.originalName.split(/[\\/]/).pop()?.trim() ?? ''
  const ext = extname(displayName).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new UploadError(
      'Only MP4 video, MP3 audio or JPG/PNG/WebP image files can be uploaded.',
    )
  }

  const declared = Number(input.contentLength)
  if (Number.isFinite(declared) && declared > MEDIA_UPLOAD_MAX_BYTES) {
    throw new UploadError(`Files must be ${friendlyMaxSize()} or smaller.`, 413)
  }

  // Tolerance for clients that send no useful type (octet-stream / blank);
  // when a real type is present it must match the extension's family.
  const mime = input.contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  if (mime && mime !== 'application/octet-stream') {
    const family = CONTENT_FAMILIES[ext] ?? ''
    if (family && !mime.startsWith(family)) {
      throw new UploadError(`That file's content type (${mime}) does not match the ${ext} extension.`)
    }
  }

  if (!input.body) {
    throw new UploadError('The uploaded file was empty.')
  }

  const fileName = `${randomUUID()}${ext}`
  const dir = join(UPLOADS_DIR, 'media')
  await mkdir(dir, { recursive: true })
  const target = join(dir, fileName)

  let bytes = 0
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length
      if (bytes > MEDIA_UPLOAD_MAX_BYTES) {
        callback(new UploadError(`Files must be ${friendlyMaxSize()} or smaller.`, 413))
        return
      }
      callback(null, chunk)
    },
  })

  try {
    const body = Readable.fromWeb(
      input.body as unknown as import('node:stream/web').ReadableStream,
    )
    await pipeline(body, limiter, createWriteStream(target))
  } catch (err) {
    await rm(target, { force: true }).catch(() => {})
    if (err instanceof UploadError) throw err
    // A disk failure is ours, not the caller's: 500 tells the client to
    // report it rather than to retry with different input.
    throw new UploadError('The file could not be stored. Try again.', 500)
  }

  if (bytes === 0) {
    await rm(target, { force: true }).catch(() => {})
    throw new UploadError('The uploaded file was empty.')
  }

  return { url: `${MEDIA_UPLOAD_BASE}/${fileName}`, name: displayName || fileName, size: bytes }
}

/**
 * Deletes the file behind a stored upload URL — best-effort, called when a
 * catalog row is deleted or its file replaced. URLs that are not ours (null,
 * the bundled master, hand-edited values that slipped validation) are no-ops.
 */
export async function removeUploadedMedia(url: string | null): Promise<void> {
  if (!url) return
  const match = ANY_UPLOAD_URL_PATTERN.exec(url)
  const name = match?.[1]
  if (!name) return
  try {
    await rm(join(UPLOADS_DIR, 'media', name), { force: true })
  } catch {
    // Best-effort: an orphaned file is harmless; a failed request is not.
  }
}
