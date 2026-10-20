import { asc, eq } from 'drizzle-orm'
import { db } from '../db.ts'
import { service } from '../schema.ts'
import type { Service } from './types.ts'

/** Active catalog, in display order. */
export async function listServices(): Promise<Service[]> {
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

  return rows.map((row) => ({ ...row, pricePhp: Number(row.pricePhp) }))
}
