import { randomUUID } from 'node:crypto'
import { asc, desc, eq, like } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { service } from '../../db/schema.ts'
import { cacheDel, cacheGet, cacheSet } from '../../shared/cache.ts'
import { BookingError, type Service } from './types.ts'
import {
  validateServiceDescription,
  validateServiceName,
  validateServicePrice,
  validateServiceUnit,
  validateServiceWing,
} from './validation.ts'

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

/** A catalog row as the admin editor sees it: active flag included. */
export interface AdminService extends Service {
  isActive: boolean
}

const ADMIN_SERVICE_COLUMNS = {
  id: service.id,
  code: service.code,
  name: service.name,
  wing: service.wing,
  description: service.description,
  unit: service.unit,
  pricePhp: service.pricePhp,
  durationDays: service.durationDays,
  sortOrder: service.sortOrder,
  isActive: service.isActive,
}

type AdminServiceRow = {
  id: string
  code: string
  name: string
  wing: string
  description: string
  unit: string
  pricePhp: string
  durationDays: number
  sortOrder: number
  isActive: boolean
}

function toAdminService(row: AdminServiceRow): AdminService {
  return { ...row, pricePhp: Number(row.pricePhp) }
}

/** Every row, active or not — admin edits must not hide retired services. */
export async function listAllServicesForAdmin(): Promise<AdminService[]> {
  const rows = await db
    .select(ADMIN_SERVICE_COLUMNS)
    .from(service)
    .orderBy(asc(service.sortOrder), asc(service.name))
  return rows.map(toAdminService)
}

async function findServiceForAdmin(id: string): Promise<AdminService | null> {
  const rows = await db
    .select(ADMIN_SERVICE_COLUMNS)
    .from(service)
    .where(eq(service.id, id))
    .limit(1)
  const row = rows[0]
  return row ? toAdminService(row) : null
}

/**
 * A stable, human-readable code derived from the name ("Vocal Coaching" →
 * "VOCAL-COACHING"). Uniqueness is resolved with a numeric suffix, so adding a
 * service never asks the admin to think about codes.
 */
async function nextServiceCode(name: string): Promise<string> {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'SERVICE'
  const rows = await db
    .select({ code: service.code })
    .from(service)
    .where(like(service.code, `${base}%`))
  const taken = new Set(rows.map((row) => row.code))
  if (!taken.has(base)) return base
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}

/** Adds one catalog row; validation lives here so every caller gets it. */
export async function createService(input: Record<string, unknown>): Promise<AdminService> {
  const name = validateServiceName(input.name)
  const wing = validateServiceWing(input.wing)
  const unit = validateServiceUnit(input.unit)
  const pricePhp = validateServicePrice(input.pricePhp)
  const description = validateServiceDescription(input.description)

  const code = await nextServiceCode(name)
  const last = await db
    .select({ sortOrder: service.sortOrder })
    .from(service)
    .orderBy(desc(service.sortOrder))
    .limit(1)

  const id = randomUUID()
  await db.insert(service).values({
    id,
    code,
    name,
    wing,
    description,
    unit,
    pricePhp: String(pricePhp),
    // New rows land at the bottom of the catalog.
    sortOrder: (last[0]?.sortOrder ?? -1) + 1,
  })
  await invalidateServicesCache()

  const created = await findServiceForAdmin(id)
  if (!created) throw new Error('The service could not be read back after saving.')
  return created
}

/** Updates the two fields the admin editor owns: description and price. */
export async function updateService(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminService> {
  const description = validateServiceDescription(input.description)
  const pricePhp = validateServicePrice(input.pricePhp)

  const updated = await db
    .update(service)
    .set({ description, pricePhp: String(pricePhp), updatedAt: new Date() })
    .where(eq(service.id, id))
    .returning({ id: service.id })

  if (updated.length === 0) {
    throw new BookingError('That service does not exist.', 404)
  }
  await invalidateServicesCache()

  const row = await findServiceForAdmin(id)
  if (!row) throw new Error('The service could not be read back after updating.')
  return row
}

