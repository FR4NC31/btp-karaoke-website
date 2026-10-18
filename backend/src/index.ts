import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { auth } from './auth.ts'
import { requireSession } from './session-middleware.ts'
import {
  BookingError,
  cancelBooking,
  createBooking,
  listBookingsForUser,
  listServices,
  studioToday,
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

export default app
