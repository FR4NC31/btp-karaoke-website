import { asc, eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { service } from '../../db/schema.ts'
import { cacheDel, cacheGet, cacheSet } from '../../shared/cache.ts'
import type { Service } from './types.ts'

const SERVICES_KEY = 'services:active'
const SERVICES_TTL = 300 // 5 minutes

/** Active catalog, in display order. */
export async function listServices(): Promise<Service[]> {
  const cached = await cacheGet<Service[]>(SERVICES_KEY)
  if (cached) return cached

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
  await cacheSet(SERVICES_KEY, value, SERVICES_TTL)
  return value
}

/** Drop the cached catalog (call after any service mutation). */
export async function invalidateServicesCache(): Promise<void> {
  await cacheDel(SERVICES_KEY)
}

