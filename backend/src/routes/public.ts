import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { listServices, studioToday } from '../bookings.ts'
import { listPublicMedia } from '../media.ts'
import { requireSession } from '../session-middleware.ts'

const publicApi = new Hono()

// Example protected route — returns 401 unless signed in.
publicApi.get('/me', requireSession, (c) => {
  const session = c.get('session')
  if (!session) {
    throw new HTTPException(401)
  }
  return c.json({ user: session.user })
})

// Public: the catalog is marketing copy, no session needed to browse it.
// `studioToday` lets the booking form set its minimum date in the studio's
// own timezone rather than trusting the visitor's clock.
publicApi.get('/services', async (c) => {
  const services = await listServices()
  return c.json({ services, studioToday: studioToday() })
})

// Public: the media hub catalog behind /studio — active rows only, already
// section-ordered (video → music → radio) so the hub only has to group.
publicApi.get('/media', async (c) => {
  const items = await listPublicMedia()
  return c.json({ items })
})

export default publicApi
