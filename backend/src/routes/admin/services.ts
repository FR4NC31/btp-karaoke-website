import { Hono } from 'hono'
import {
  BookingError,
  createService,
  listAllServicesForAdmin,
  updateService,
} from '../../modules/bookings/index.ts'

/**
 * Admin service catalog. The public /api/services feed is active rows only;
 * this one includes everything so the console can edit a row it still has.
 * Bodies are validated in modules/bookings/validation.ts, so a bad field is a
 * 400 with the reason the admin can act on.
 */
const adminServices = new Hono()

adminServices.get('/', async (c) => {
  const services = await listAllServicesForAdmin()
  return c.json({ services })
})

adminServices.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    const service = await createService((body ?? {}) as Record<string, unknown>)
    return c.json({ service }, 201)
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

// Only the fields the admin editor owns: description and price.
adminServices.patch('/:id', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }

  try {
    const service = await updateService(
      c.req.param('id'),
      (body ?? {}) as Record<string, unknown>,
    )
    return c.json({ service })
  } catch (err) {
    if (err instanceof BookingError) {
      return c.json({ error: err.message }, err.status)
    }
    throw err
  }
})

export default adminServices
