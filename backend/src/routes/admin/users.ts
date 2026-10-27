import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { listUsersForTagging } from '../../modules/bookings/index.ts'
import {
  BookingError,
  getUserMembership,
  MEMBERSHIP_TIERS,
  setUserMembership,
} from '../../modules/membership/index.ts'

const adminUsers = new Hono()

// Registered accounts for the "tag a customer" picker.
adminUsers.get('/', async (c) => {
  const users = await listUsersForTagging(c.req.query('query'))
  return c.json({ users })
})

// Read one account's membership tier + expiry.
adminUsers.get('/:id/membership', async (c) => {
  try {
    const membership = await getUserMembership(c.req.param('id'))
    return c.json({ membership })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: (err as Error).message }, err.status)
    }
    throw err
  }
})

// Grant or revoke a membership tier (admin only).
adminUsers.post('/:id/membership', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  const { tier, expiresAt } = (body ?? {}) as Record<string, unknown>
  if (typeof tier !== 'string') {
    return c.json({ error: 'tier is required.' }, 400)
  }
  if (expiresAt !== undefined && expiresAt !== null && typeof expiresAt !== 'string') {
    return c.json({ error: 'expiresAt must be an ISO string or null.' }, 400)
  }

  try {
    const membership = await setUserMembership(
      c.req.param('id'),
      tier,
      typeof expiresAt === 'string' ? expiresAt : null,
    )
    return c.json({ membership })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: (err as Error).message }, err.status)
    }
    throw err
  }
})

export default adminUsers
