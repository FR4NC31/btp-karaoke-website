import { Hono } from 'hono'
import {
  ADMIN_ACTION_NAMES,
  BookingError,
  adminSetBookingStatus,
  approvePayment,
  createBookingForOthers,
  listAllBookings,
  rejectPayment,
  studioToday,
  type AdminBookingAction,
  type BookingStatus,
} from '../../modules/bookings/index.ts'
import { BOOKING_STATUSES } from '../../db/schema.ts'

const adminBookings = new Hono()

// Every customer's reservations. Optional filters: ?status=, ?date=, ?query=.
adminBookings.get('/', async (c) => {
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
// guest name typed in by the admin. Created `confirmed` — see
// src/bookings/admin.ts (createBookingForOthers).
adminBookings.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const {
    userId,
    guestName,
    serviceId,
    bookingDate,
    bookingTime,
    notes,
  } = (body ?? {}) as Record<string, unknown>
  if (typeof serviceId !== 'string' || typeof bookingDate !== 'string') {
    return c.json({ error: 'serviceId and bookingDate are required.' }, 400)
  }
  if (userId !== undefined && userId !== null && typeof userId !== 'string') {
    return c.json({ error: 'userId must be a string when provided.' }, 400)
  }
  if (guestName !== undefined && typeof guestName !== 'string') {
    return c.json({ error: 'guestName must be a string when provided.' }, 400)
  }
  if (bookingTime !== undefined && bookingTime !== null && typeof bookingTime !== 'string') {
    return c.json({ error: 'bookingTime must be a string when provided.' }, 400)
  }
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    return c.json({ error: 'notes must be a string when provided.' }, 400)
  }

  try {
    const booking = await createBookingForOthers({
      userId: typeof userId === 'string' ? userId : null,
      guestName: typeof guestName === 'string' ? guestName : undefined,
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

// Payment decisions are registered BEFORE the generic /:id/:action route:
// Hono matches in registration order, so a route registered after a param
// route would never be reached ("approve-payment" would hit the generic
// handler, fail the action-name check, and 404 as "Unknown action.").
adminBookings.post('/:id/approve-payment', async (c) => {
  try {
    const booking = await approvePayment(c.req.param('id'))
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

adminBookings.post('/:id/reject-payment', async (c) => {
  try {
    const booking = await rejectPayment(c.req.param('id'))
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// One endpoint for every admin status move; the legal from-states live in
// ADMIN_ACTIONS (src/bookings/admin.ts) and are enforced in the UPDATE itself.
// Must stay LAST among the /:id/... POST routes — see the ordering note above.
adminBookings.post('/:id/:action', async (c) => {
  const action = c.req.param('action')
  // Same list the transition table is built from (src/bookings/admin.ts), so an action
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

export default adminBookings

