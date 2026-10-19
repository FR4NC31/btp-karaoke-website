import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { auth } from './auth.ts'
import { requireAdmin, requireSession } from './session-middleware.ts'
import {
  ADMIN_ACTION_NAMES,
  BookingError,
  adminSetBookingStatus,
  cancelBooking,
  createBooking,
  createBookingForOthers,
  listAllBookings,
  listBookingsForUser,
  listServices,
  listUsersForTagging,
  studioToday,
  type AdminBookingAction,
  type BookingStatus,
} from './bookings.ts'
import {
  MediaError,
  createMediaItem,
  deleteMediaItem,
  discardUpload,
  listMediaForAdmin,
  listPublicMedia,
  moveMediaItem,
  setMediaVisibility,
  updateMediaItem,
  type MediaSection,
} from './media.ts'
import { BOOKING_STATUSES } from './schema.ts'
import {
  UploadError,
  mediaContentType,
  mediaFilePath,
  storeMediaUpload,
} from './uploads.ts'

const app = new Hono()

// Origins allowed to call the API endpoints with credentials.
// Must never be `*` when credentials are enabled.
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  ...(process.env.EXTRA_TRUSTED_ORIGINS?.split(',').map((o) => o.trim()) ?? []),
]

app.get('/health', (c) => {
  return c.json({
    message: 'This is healthy',
    status: 200
  })
})

// One CORS policy for the whole API surface — auth endpoints plus the booking
// routes below. Registered before them so nothing is left un-CORSed.
app.use(
  '/api/*',
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)

// Better Auth handles everything under /api/auth/* (sign-in, sign-up,
// Google OAuth callback, session, sign-out...). Register before any
// catch-all so it isn't shadowed.
app.all('/api/auth/*', (c) => auth.handler(c.req.raw))

// Example protected route — returns 401 unless signed in.
app.get('/api/me', requireSession, (c) => {
  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }
  return c.json({ user: session.user })
})

// ---------------------------------------------------------------------------
// Booking API
//
// Day-only for now: POST /api/bookings takes a service and a whole day. Time
// slots and time blocks are a later migration; the status column already
// carries `pending -> confirmed | rejected` for the admin acceptance flow.
// ---------------------------------------------------------------------------

// Public: the catalog is marketing copy, no session needed to browse it.
// `studioToday` lets the booking form set its minimum date in the studio's
// own timezone rather than trusting the visitor's clock.
app.get('/api/services', async (c) => {
  const services = await listServices()
  return c.json({ services, studioToday: studioToday() })
})

// Public: the media hub catalog behind /studio — active rows only, already
// section-ordered (video → music → radio) so the hub only has to group.
app.get('/api/media', async (c) => {
  const items = await listPublicMedia()
  return c.json({ items })
})

// Uploaded catalog files (MP4/MP3 media and their cover images), public like
// the hub feed itself. Served with byte-range support — browsers request
// ranges while seeking, and an uploaded video should scrub in the console
// exactly like the bundled master. Names are the uuid filenames the uploader
// generated; anything else is 404.
app.get('/api/uploads/media/:name', async (c) => {
  const name = c.req.param('name')
  const filePath = mediaFilePath(name)
  if (!filePath) {
    return c.json({ error: 'Not found.' }, 404)
  }

  let size: number
  try {
    const info = await stat(filePath)
    if (!info.isFile()) {
      return c.json({ error: 'Not found.' }, 404)
    }
    size = info.size
  } catch {
    return c.json({ error: 'Not found.' }, 404)
  }

  const baseHeaders = {
    'content-type': mediaContentType(name),
    'accept-ranges': 'bytes',
    // uuid names are never reused, so the file behind one is immutable.
    'cache-control': 'public, max-age=31536000, immutable',
  }

  const range = c.req.header('range')?.trim()
  if (!range) {
    const body = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream
    return new Response(body, {
      headers: { ...baseHeaders, 'content-length': String(size) },
    })
  }

  // Single-range requests only ("bytes=a-b", "bytes=a-", "bytes=-n") — which
  // is all a media element ever sends.
  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  if (match) {
    const [, rawStart = '', rawEnd = ''] = match
    let start = rawStart ? Number(rawStart) : 0
    let end = rawEnd ? Number(rawEnd) : size - 1
    if (!rawStart && rawEnd) {
      // Suffix range: the last N bytes.
      const suffix = Number(rawEnd)
      start = Math.max(size - suffix, 0)
      end = size - 1
    }
    if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < size) {
      end = Math.min(end, size - 1)
      const body = Readable.toWeb(createReadStream(filePath, { start, end })) as unknown as ReadableStream
      return new Response(body, {
        status: 206,
        headers: {
          ...baseHeaders,
          'content-range': `bytes ${start}-${end}/${size}`,
          'content-length': String(end - start + 1),
        },
      })
    }
  }

  // Unsatisfiable or unsupported range — answer 416 like a static server.
  return new Response(null, {
    status: 416,
    headers: { ...baseHeaders, 'content-range': `bytes */${size}` },
  })
})

// The caller's own bookings only — never another user's.
app.get('/api/bookings', requireSession, async (c) => {
  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }
  const bookings = await listBookingsForUser(session.user.id)
  return c.json({ bookings, studioToday: studioToday() })
})

app.post('/api/bookings', requireSession, async (c) => {
  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { serviceId, bookingDate, notes } = (body ?? {}) as Record<string, unknown>
  if (typeof serviceId !== 'string' || typeof bookingDate !== 'string') {
    return c.json({ error: 'serviceId and bookingDate are required.' }, 400)
  }
  // Silently dropping a non-string `notes` would answer 201 while discarding
  // what the caller sent, so an unusable shape is rejected instead.
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    return c.json({ error: 'notes must be a string when provided.' }, 400)
  }

  try {
    const booking = await createBooking({
      userId: session.user.id,
      serviceId,
      bookingDate,
      notes: typeof notes === 'string' ? notes : undefined,
    })
    return c.json({ booking }, 201)
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Withdraw a pending booking. POST rather than DELETE because the row is kept
// and moved to `cancelled` — the history stays auditable for the admin view.
app.post('/api/bookings/:id/cancel', requireSession, async (c) => {
  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }

  try {
    const booking = await cancelBooking(c.req.param('id'), session.user.id)
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// ---------------------------------------------------------------------------
// Admin API
//
// Sub-app with `requireAdmin` registered ONCE on its root: every route below
// inherits the 401/403 gate by construction, so a route added here later
// cannot ship unguarded. Handlers trust nothing from the client beyond shape
// (ids, names, days) — the role was already verified against the database.
// ---------------------------------------------------------------------------

const adminApi = new Hono()

adminApi.use('*', requireAdmin)

// Every customer's reservations. Optional filters: ?status=, ?date=, ?query=.
adminApi.get('/bookings', async (c) => {
  const statusParam = c.req.query('status')
  // Validated against the schema's own list rather than a copy of it: a
  // duplicated literal here would silently drop a status the database accepts.
  const status =
    statusParam && (BOOKING_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as BookingStatus)
      : undefined

  const bookings = await listAllBookings({
    status,
    date: c.req.query('date')?.trim() || undefined,
    query: c.req.query('query')?.trim() || undefined,
  })
  return c.json({ bookings, studioToday: studioToday() })
})

// A reservation for someone else: a tagged registered customer (userId) or a
// guest name typed in by the admin. Created `confirmed` — see bookings.ts.
adminApi.post('/bookings', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { userId, guestName, serviceId, bookingDate, notes } = (body ?? {}) as Record<
    string,
    unknown
  >
  if (typeof serviceId !== 'string' || typeof bookingDate !== 'string') {
    return c.json({ error: 'serviceId and bookingDate are required.' }, 400)
  }
  if (userId !== undefined && userId !== null && typeof userId !== 'string') {
    return c.json({ error: 'userId must be a string when provided.' }, 400)
  }
  if (guestName !== undefined && typeof guestName !== 'string') {
    return c.json({ error: 'guestName must be a string when provided.' }, 400)
  }
  // Same rule as the customer path: reject a shape we cannot store rather than
  // answering 201 and dropping it.
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    return c.json({ error: 'notes must be a string when provided.' }, 400)
  }

  try {
    const booking = await createBookingForOthers({
      userId: typeof userId === 'string' ? userId : null,
      guestName: typeof guestName === 'string' ? guestName : undefined,
      serviceId,
      bookingDate,
      notes: typeof notes === 'string' ? notes : undefined,
    })
    return c.json({ booking }, 201)
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// One endpoint for every admin status move; the legal from-states live in
// ADMIN_ACTIONS (bookings.ts) and are enforced in the UPDATE itself.
adminApi.post('/bookings/:id/:action', async (c) => {
  const action = c.req.param('action')
  // Same list the transition table is built from (bookings.ts), so an action
  // can never be routable here without a legal move defined for it.
  if (!(ADMIN_ACTION_NAMES as readonly string[]).includes(action)) {
    return c.json({ error: 'Unknown action.' }, 404)
  }

  try {
    const booking = await adminSetBookingStatus(c.req.param('id'), action as AdminBookingAction)
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Registered accounts for the "tag a customer" picker.
adminApi.get('/users', async (c) => {
  const users = await listUsersForTagging(c.req.query('query'))
  return c.json({ users })
})

// ---------------------------------------------------------------------------
// Admin: media hub catalog
//
// /studio renders what these routes curate — video songs, music tracks and
// radio stations. Hidden rows drop out of the public /api/media feed without
// being deleted; `move` reorders within a section; `delete` is permanent.
// Bodies are validated in src/media.ts, so a bad field is a 400 with a
// specific message.
// ---------------------------------------------------------------------------

const MEDIA_SECTIONS: MediaSection[] = ['video', 'music', 'radio']

adminApi.get('/media', async (c) => {
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
adminApi.post('/media', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    const item = await createMediaItem((body ?? {}) as Record<string, unknown>)
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
// straight to disk. Registered BEFORE /media/:id below — otherwise that
// two-segment pattern would swallow /media/upload. Returns { file } and the
// editor saves its url on the row via create/update.
adminApi.post('/media/upload', async (c) => {
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
adminApi.post('/media/upload/discard', async (c) => {
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
adminApi.post('/media/:id', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    const item = await updateMediaItem(c.req.param('id'), (body ?? {}) as Record<string, unknown>)
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Hide/show without deleting. Body: { "isActive": true | false }.
adminApi.post('/media/:id/visibility', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { isActive } = (body ?? {}) as Record<string, unknown>
  try {
    const item = await setMediaVisibility(c.req.param('id'), isActive)
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Swap with the neighbour inside the section. Body: { "direction": "up" | "down" }.
adminApi.post('/media/:id/move', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { direction } = (body ?? {}) as Record<string, unknown>
  try {
    const item = await moveMediaItem(c.req.param('id'), direction)
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Permanent removal — prefer visibility=false when the row is merely retired.
adminApi.post('/media/:id/delete', async (c) => {
  try {
    const item = await deleteMediaItem(c.req.param('id'))
    return c.json({ item })
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

app.route('/api/admin', adminApi)

export default app
