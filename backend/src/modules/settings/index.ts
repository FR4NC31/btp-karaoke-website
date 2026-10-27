import { eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { siteSetting } from '../../db/schema.ts'

const GCASH_QR_KEY = 'gcash_qr_url'

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
