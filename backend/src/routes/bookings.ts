import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  BookingError,
  cancelBooking,
  createBooking,
  listBookingsForUser,
  listPublicBlockouts,
  studioToday,
} from '../bookings.ts'
import { requireSession } from '../session-middleware.ts'

/**
 * The signed-in customer's own reservations.
 * POST takes a service, a whole day, and an optional time slot `HH:MM`.
 * Per-hour services require a start time on the hour; per-minute services
 * accept any `HH:MM`; per-day services take the date only.
 * The status column carries `pending -> confirmed | rejected` for the
 * admin acceptance flow.
 */
const bookingApi = new Hono()

/**
 * Upcoming studio closures. Read-only for customers: they need the days and
 * the optional reason so the desk can disable them; notes/creators stay admin.
 */
bookingApi.get('/blockouts', requireSession, async (c) => {
  c.header('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
  const blockouts = await listPublicBlockouts()
  return c.json({ blockouts, studioToday: studioToday() })
})

// The caller's own bookings only — never another user's.
bookingApi.get('/', requireSession, async (c) => {
  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }
  const bookings = await listBookingsForUser(session.user.id)
  return c.json({ bookings, studioToday: studioToday() })
})

bookingApi.post('/', requireSession, async (c) => {
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

  const { serviceId, bookingDate, bookingTime, notes } = (body ?? {}) as Record<
    string,
    unknown
  >
  if (typeof serviceId !== 'string' || typeof bookingDate !== 'string') {
    return c.json({ error: 'serviceId and bookingDate are required.' }, 400)
  }
  if (bookingTime !== undefined && bookingTime !== null && typeof bookingTime !== 'string') {
    return c.json({ error: 'bookingTime must be a string when provided.' }, 400)
  }
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    return c.json({ error: 'notes must be a string when provided.' }, 400)
  }

  try {
    const booking = await createBooking({
      userId: session.user.id,
      serviceId,
      bookingDate,
      bookingTime: typeof bookingTime === 'string' ? bookingTime : undefined,
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
bookingApi.post('/:id/cancel', requireSession, async (c) => {
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

export default bookingApi
