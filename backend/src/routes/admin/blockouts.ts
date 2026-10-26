import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  BookingError,
  createBlockout,
  deleteBlockout,
  listBlockouts,
  studioToday,
} from '../../modules/bookings/index.ts'
import type { AuthEnv } from '../../middleware/session.ts'

/**
 * Admin-managed closed days. Mounted under /api/admin/blockouts, so the
 * admin role gate is already applied by routes/admin/index.ts.
 *
 * POST body: { bookingDate, reason?, note? }
 *   reason ∈ unavailable | maintenance | other | null (no reason)
 * POST /:id/delete reopens the day.
 */
const adminBlockouts = new Hono<AuthEnv>()

adminBlockouts.get('/', async (c) => {
  const blockouts = await listBlockouts()
  return c.json({ blockouts, studioToday: studioToday() })
})

adminBlockouts.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { bookingDate, reason, note } = (body ?? {}) as Record<string, unknown>
  if (typeof bookingDate !== 'string') {
    return c.json({ error: 'bookingDate is required.' }, 400)
  }
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    return c.json({ error: 'reason must be a string when provided.' }, 400)
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    return c.json({ error: 'note must be a string when provided.' }, 400)
  }

  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }

  try {
    const blockout = await createBlockout({
      bookingDate,
      reason: typeof reason === 'string' ? reason : null,
      note: typeof note === 'string' ? note : undefined,
      createdBy: session.user.id,
    })
    return c.json({ blockout }, 201)
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

adminBlockouts.post('/:id/delete', async (c) => {
  try {
    const blockout = await deleteBlockout(c.req.param('id'))
    return c.json({ blockout })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

export default adminBlockouts

