import { eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { siteSetting } from '../../db/schema.ts'

const GCASH_QR_KEY = 'gcash_qr_url'
const CONTACT_KEY = 'contact_details'

export interface ContactDetails {
  facebookUrl: string
  facebookLabel: string
  email: string
  phone: string
  phoneHref: string
  address: string
}

export async function getGcashQrUrl(): Promise<string | null> {
  const rows = await db.select({ value: siteSetting.value }).from(siteSetting).where(eq(siteSetting.key, GCASH_QR_KEY)).limit(1)
  return rows[0]?.value ?? null
}

export async function setGcashQrUrl(url: string): Promise<void> {
  await db
    .insert(siteSetting)
    .values({ key: GCASH_QR_KEY, value: url, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSetting.key, set: { value: url, updatedAt: new Date() } })
}

export async function getContactDetails(): Promise<ContactDetails | null> {
  const rows = await db.select({ value: siteSetting.value }).from(siteSetting).where(eq(siteSetting.key, CONTACT_KEY)).limit(1)
  const raw = rows[0]?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ContactDetails>
    return {
      facebookUrl: String(parsed.facebookUrl ?? '').trim(),
      facebookLabel: String(parsed.facebookLabel ?? '').trim(),
      email: String(parsed.email ?? '').trim(),
      phone: String(parsed.phone ?? '').trim(),
      phoneHref: String(parsed.phoneHref ?? '').trim(),
      address: String(parsed.address ?? '').trim(),
    }
  } catch {
    return null
  }
}

export async function setContactDetails(details: ContactDetails): Promise<void> {
  const value = JSON.stringify(details)
  await db
    .insert(siteSetting)
    .values({ key: CONTACT_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSetting.key, set: { value, updatedAt: new Date() } })
}