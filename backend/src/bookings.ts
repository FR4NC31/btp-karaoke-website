import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from './db.ts'
import { booking, service, type BookingStatus } from './schema.ts'

/**
 * Service catalog + day bookings, on Drizzle.
 *
 * "Assigning a service to a user" is what a booking row IS — the join between
 * the two, pinned to a calendar day. The service table never references a
 * user. See src/schema.ts for the tables and the ownership split with
 * better-auth_migrations/.
 *
 * Day-only for now: a booking claims one whole day and there is no time slot
 * or time block column yet. `durationDays` is catalog metadata (turnaround),
 * not a claim on extra days.
 */

export type { BookingStatus }

export interface Service {
  id: string
  code: string
  name: string
  wing: string
  description: string
  unit: string
  pricePhp: number
  durationDays: number
  sortOrder: number
}

export interface Booking {
  id: string
  referenceCode: string
  serviceId: string
  serviceCode: string
  serviceName: string
  serviceUnit: string
  pricePhp: number
  /** Whole day, `YYYY-MM-DD`. No time component yet. */
  bookingDate: string
  status: BookingStatus
  notes: string | null
  createdAt: string
}

/** Thrown for anything the route should turn into a specific HTTP status. */
export class BookingError extends Error {
  readonly status: 400 | 404 | 409

  constructor(message: string, status: 400 | 404 | 409) {
    super(message)
    this.name = 'BookingError'
    this.status = status
  }
}

/**
 * The studio's calendar day boundary. A booking is a *local* day, so "today"
 * must be resolved in the studio's timezone — comparing against UTC would let
 * someone book a day that has already ended in Manila (UTC+8), and block a
 * valid today between midnight and 08:00 local.
 */
const STUDIO_TIMEZONE = process.env.STUDIO_TIMEZONE ?? 'Asia/Manila'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Max horizon for a booking — a typo guard, not a business rule. */
const MAX_DAYS_AHEAD = 730

const NOTES_MAX = 500

/** Today's date in the studio's timezone, as `YYYY-MM-DD`. */
export function studioToday(): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the column's ISO form.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Shifts a `YYYY-MM-DD` string by whole days and returns the same form. */
function addDays(isoDate: string, days: number): string {
  // Defaults only satisfy noUncheckedIndexedAccess — callers pass studioToday().
  const [y = 1970, m = 1, d = 1] = isoDate.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return shifted.toISOString().slice(0, 10)
}

/** 23505 is unique_violation. Drizzle rethrows the driver error, but a wrapped
 * cause is checked too so this keeps working if that ever changes. */
function isUniqueViolation(err: unknown): boolean {
  const codeOf = (value: unknown) =>
    typeof value === 'object' && value !== null ? (value as { code?: string }).code : undefined
  return codeOf(err) === '23505' || codeOf((err as { cause?: unknown })?.cause) === '23505'
}

/** Columns the API exposes for a booking, joined with its service. */
const bookingColumns = {
  id: booking.id,
  referenceCode: booking.referenceCode,
  serviceId: booking.serviceId,
  bookingDate: booking.bookingDate,
  status: booking.status,
  notes: booking.notes,
  createdAt: booking.createdAt,
  serviceCode: service.code,
  serviceName: service.name,
  serviceUnit: service.unit,
  pricePhp: service.pricePhp,
}

type BookingRow = {
  id: string
  referenceCode: string
  serviceId: string
  bookingDate: string
  status: BookingStatus
  notes: string | null
  createdAt: Date
  serviceCode: string
  serviceName: string
  serviceUnit: string
  pricePhp: string
}

/** numeric arrives from Postgres as a string to protect precision; these are
 * peso amounts well inside float range, so parse once at the boundary. */
function toBooking(row: BookingRow): Booking {
  return {
    ...row,
    pricePhp: Number(row.pricePhp),
    createdAt: row.createdAt.toISOString(),
  }
}

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

/**
 * The signed-in user's own bookings, newest day first.
 *
 * `bookingDate` is read in `mode: 'string'`, so it stays the ISO day the
 * column holds instead of being parsed into a JS Date at local midnight —
 * that round trip can slide the day across a timezone boundary, which is
 * exactly the bug a day-only booking must not have.
 */
export async function listBookingsForUser(userId: string): Promise<Booking[]> {
  const rows = await db
    .select(bookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .where(eq(booking.userId, userId))
    .orderBy(desc(booking.bookingDate), desc(booking.createdAt))

  return rows.map(toBooking)
}

async function findBookingForUser(bookingId: string, userId: string): Promise<Booking | null> {
  const rows = await db
    .select(bookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .where(and(eq(booking.id, bookingId), eq(booking.userId, userId)))
    .limit(1)

  const row = rows[0]
  return row ? toBooking(row) : null
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** `BTP-XXXXXX` — unambiguous characters, safe to read out loud. */
function makeReferenceCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)]
  }
  return `BTP-${code}`
}

export interface CreateBookingInput {
  userId: string
  serviceId: string
  bookingDate: string
  notes?: string
}

/**
 * Books one service for one day for one user.
 *
 * Validates the day locally (format, not past, not absurdly far), confirms the
 * service is real and active, then relies on `booking_active_unique_idx` to
 * reject a duplicate live booking for the same service on the same day —
 * surfacing it as a friendly 409 rather than a raw constraint error.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingDate = input.bookingDate?.trim() ?? ''

  if (!ISO_DATE.test(bookingDate)) {
    throw new BookingError('Pick a date in YYYY-MM-DD format.', 400)
  }

  // The shape alone accepts days that do not exist — 2027-02-29, 2027-04-31,
  // 2027-13-01. Those reach Postgres, which rejects them as an out-of-range
  // `date` and surfaces to the client as an uncaught 500, so reject them here.
  // `Date` rolls impossible days over (2027-04-31 -> 2027-05-01) rather than
  // failing, so parsing back and comparing is what actually catches it.
  const parsedDay = new Date(`${bookingDate}T00:00:00Z`)
  if (Number.isNaN(parsedDay.getTime()) || parsedDay.toISOString().slice(0, 10) !== bookingDate) {
    throw new BookingError('That is not a real calendar date. Pick a valid day.', 400)
  }

  const today = studioToday()
  if (bookingDate < today) {
    throw new BookingError('That day has already passed. Pick today or a later date.', 400)
  }
  if (bookingDate > addDays(today, MAX_DAYS_AHEAD)) {
    throw new BookingError('That date is too far ahead. Pick something within two years.', 400)
  }

  const notes = input.notes?.trim() || null
  if (notes && notes.length > NOTES_MAX) {
    throw new BookingError(`Notes must be ${NOTES_MAX} characters or fewer.`, 400)
  }

  const available = await db
    .select({ id: service.id })
    .from(service)
    .where(and(eq(service.id, input.serviceId), eq(service.isActive, true)))
    .limit(1)

  if (available.length === 0) {
    throw new BookingError('That service is not available.', 404)
  }

  try {
    const inserted = await db
      .insert(booking)
      .values({
        id: randomUUID(),
        referenceCode: makeReferenceCode(),
        userId: input.userId,
        serviceId: input.serviceId,
        bookingDate,
        status: 'pending',
        notes,
      })
      .returning({ id: booking.id })

    const insertedRow = inserted[0]
    if (!insertedRow) {
      throw new BookingError('The booking could not be saved.', 400)
    }

    const created = await findBookingForUser(insertedRow.id, input.userId)
    if (!created) {
      throw new BookingError('The booking could not be read back after saving.', 400)
    }
    return created
  } catch (err) {
    // The only unique index a user can trip here is booking_active_unique_idx,
    // so the message can be specific.
    if (isUniqueViolation(err)) {
      throw new BookingError('You already have a booking for that service on that day.', 409)
    }
    throw err
  }
}

/**
 * Withdraws one of the caller's own bookings.
 *
 * Ownership and state are enforced in the UPDATE itself (`userId` and
 * `status = 'pending'`), so two tabs racing cannot both "cancel" it. A
 * zero-row result is then re-read to say *why* — missing, not yours, or no
 * longer pending.
 */
export async function cancelBooking(bookingId: string, userId: string): Promise<Booking> {
  const updated = await db
    .update(booking)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(eq(booking.id, bookingId), eq(booking.userId, userId), eq(booking.status, 'pending')),
    )
    .returning({ id: booking.id })

  if (updated.length === 0) {
    const existing = await findBookingForUser(bookingId, userId)
    if (!existing) {
      throw new BookingError('That booking does not exist.', 404)
    }
    throw new BookingError(`A ${existing.status} booking can no longer be cancelled.`, 409)
  }

  const cancelled = await findBookingForUser(bookingId, userId)
  if (!cancelled) {
    throw new BookingError('The booking could not be read back after cancelling.', 400)
  }
  return cancelled
}
