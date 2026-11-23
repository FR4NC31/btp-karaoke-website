import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getContactDetails, getGcashQrUrl, setContactDetails, setGcashQrUrl } from '../../modules/settings/index.ts'
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

adminSettings.get('/contact', async (c) => {
  const details = await getContactDetails()
  return c.json({ details })
})

adminSettings.post('/contact', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400)
  }
  const b = (body ?? {}) as Record<string, unknown>
  const details = {
    facebookUrl: typeof b.facebookUrl === 'string' ? b.facebookUrl.trim() : '',
    facebookLabel: typeof b.facebookLabel === 'string' ? b.facebookLabel.trim() : '',
    email: typeof b.email === 'string' ? b.email.trim() : '',
    phone: typeof b.phone === 'string' ? b.phone.trim() : '',
    phoneHref: typeof b.phoneHref === 'string' ? b.phoneHref.trim() : '',
    address: typeof b.address === 'string' ? b.address.trim() : '',
  }
  if (!details.email || !details.phone || !details.address) {
    return c.json({ error: 'Email, phone and address are required.' }, 400)
  }
  await setContactDetails(details)
  return c.json({ details })
})

export default adminSettings
