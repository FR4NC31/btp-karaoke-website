import { Hono } from 'hono'
import {
  MediaError,
  createMediaItem,
  deleteMediaItem,
  discardUpload,
  invalidateMediaCache,
  listMediaForAdmin,
  moveMediaItem,
  setMediaVisibility,
  updateMediaItem,
  type MediaSection,
} from '../../media.ts'
import { UploadError, storeMediaUpload } from '../../uploads.ts'

/**
 * Admin media hub catalog. /studio renders what these routes curate — video
 * songs, music tracks and radio stations. Hidden rows drop out of the public
 * /api/media feed without being deleted; `move` reorders within a section;
 * `delete` is permanent. Bodies are validated in src/media/validation.ts, so
 * a bad field is a 400 with a specific message.
 */
const adminMedia = new Hono()

const MEDIA_SECTIONS: MediaSection[] = ['video', 'music', 'radio']

adminMedia.get('/', async (c) => {
  const sectionParam = c.req.query('section')
  const section =
    sectionParam && (MEDIA_SECTIONS as string[]).includes(sectionParam)
      ? (sectionParam as MediaSection)
      : undefined

  const items = await listMediaForAdmin(section)
  return c.json({ items })
})

// Create. The same field shape as update — the form always submits the full
// set, and the new row lands active at the bottom of its section.
adminMedia.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    const item = await createMediaItem((body ?? {}) as Record<string, unknown>)
    await invalidateMediaCache()
    return c.json({ item }, 201)
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Upload one MP4/MP3 for a catalog row. Raw-body POST (the editor sends the
// File itself, with X-File-Name for the display copy) so the bytes stream
// straight to disk. Registered BEFORE /:id below — otherwise that single-
// segment pattern would swallow /upload. Returns { file } and the editor
// saves its url on the row via create/update.
adminMedia.post('/upload', async (c) => {
  try {
    // The editor percent-encodes X-File-Name: raw characters above U+00FF
    // (curly quotes, CJK, emoji) make fetch reject the header before it is
    // sent. Decode best-effort — a value that is not valid percent-encoding
    // passes through untouched.
    const headerName = c.req.header('x-file-name') ?? ''
    let originalName = headerName
    try {
      originalName = decodeURIComponent(headerName)
    } catch {
      originalName = headerName
    }
    const file = await storeMediaUpload({
      originalName,
      contentType: c.req.header('content-type') ?? '',
      contentLength: c.req.header('content-length'),
      body: c.req.raw.body,
    })
    return c.json({ file }, 201)
  } catch (err) {
    if (err instanceof UploadError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Discard one upload the editor made but could not save on a row. A URL some
// row still references is left alone — a lost response must never delete a
// file the hub still plays. 204 whether or not a file was removed.
adminMedia.post('/upload/discard', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    await discardUpload((body as { url?: unknown } | null)?.url)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Replace one row's editable fields (an update is a replace: clearing a box
// clears the column).
adminMedia.post('/:id', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    const item = await updateMediaItem(c.req.param('id'), (body ?? {}) as Record<string, unknown>)
    await invalidateMediaCache()
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Hide/show without deleting. Body: { "isActive": true | false }.
adminMedia.post('/:id/visibility', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { isActive } = (body ?? {}) as Record<string, unknown>
  try {
    const item = await setMediaVisibility(c.req.param('id'), isActive)
    await invalidateMediaCache()
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Swap with the neighbour inside the section. Body: { "direction": "up" | "down" }.
adminMedia.post('/:id/move', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { direction } = (body ?? {}) as Record<string, unknown>
  try {
    const item = await moveMediaItem(c.req.param('id'), direction)
    await invalidateMediaCache()
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Permanent removal — prefer visibility=false when the row is merely retired.
adminMedia.post('/:id/delete', async (c) => {
  try {
    const item = await deleteMediaItem(c.req.param('id'))
    await invalidateMediaCache()
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

export default adminMedia
