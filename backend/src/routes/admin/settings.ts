import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getGcashQrUrl, setGcashQrUrl } from '../../modules/settings/index.ts'

const adminSettings = new Hono()

adminSettings.get('/gcash-qr', async (c) => {
  const url = await getGcashQrUrl()
  return c.json({ url })
})

adminSettings.post('/gcash-qr', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }
  const { url } = (body ?? {}) as Record<string, unknown>
  if (typeof url !== 'string' || !url.trim()) {
    return c.json({ error: 'url is required.' }, 400)
  }
  await setGcashQrUrl(url.trim())
  return c.json({ url: url.trim() })
})

export default adminSettings
