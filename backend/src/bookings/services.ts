import { asc, eq } from 'drizzle-orm'
import { db } from '../db.ts'
import { service } from '../schema.ts'
import type { Service } from './types.ts'

/** In-memory cache for the rarely-changing service catalog. */
let cachedServices: { value: Service[]; expires: number } | null = null
const SERVICES_TTL_MS = 5 * 60 * 1000

/** Active catalog, in display order. */
export async function listServices(): Promise<Service[]> {
  const now = Date.now()
  if (cachedServices && cachedServices.expires > now) {
    return cachedServices.value
  }

  const rows = await db
    .select({
      id: service.id,
      code: service.code,
      name: service.name,
      wing: service.wing,
      description: service.description,
      unit: service.unit,
      pricePhp: service.pricePhp,
      durationDays: service.durationDays,
      sortOrder: service.sortOrder,
    })
    .from(service)
    .where(eq(service.isActive, true))
    .orderBy(asc(service.sortOrder), asc(service.name))

  const value = rows.map((row) => ({ ...row, pricePhp: Number(row.pricePhp) }))
  cachedServices = { value, expires: now + SERVICES_TTL_MS }
  return value
}
