import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { auth } from './auth.ts'
import { requireAdmin, requireSession } from './session-middleware.ts'
import {
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

const VALID_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
]

const adminApi = new Hono()

adminApi.use('*', requireAdmin)

// Every customer's reservations. Optional filters: ?status=, ?date=, ?query=.
adminApi.get('/bookings', async (c) => {
  const statusParam = c.req.query('status')
  const status =
    statusParam && (VALID_STATUSES as string[]).includes(statusParam)
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
  const actions: AdminBookingAction[] = ['confirm', 'reject', 'complete', 'cancel']
  if (!(actions as string[]).includes(action)) {
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

app.route('/api/admin', adminApi)

export default app
