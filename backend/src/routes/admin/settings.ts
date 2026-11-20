import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getGcashQrUrl, setGcashQrUrl } from '../../modules/settings/index.ts'
import { isUploadedImageUrl } from '../../modules/uploads/storage.ts'

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
  // Only files our own uploader stored: a QR code is an image, and letting
  // arbitrary strings through would put an unvetted src in every checkout.
  if (!isUploadedImageUrl(url.trim())) {
    return c.json({ error: 'Upload a JPG, PNG or WebP image first.' }, 400)
  }
  await setGcashQrUrl(url.trim())
  return c.json({ url: url.trim() })
})

export default adminSettings
