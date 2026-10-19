import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { db } from './db.ts'
import { booking, service, user, type BookingStatus } from './schema.ts'

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
 * Shared day validation for both booking paths (customer self-service and
 * admin reservations): format, real calendar day, not in the past, not
 * absurdly far ahead. Returns the trimmed day so callers cannot accidentally
 * keep the raw input.
 */
function validateBookingDay(raw: unknown): string {
  const bookingDate = typeof raw === 'string' ? raw.trim() : ''

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

  return bookingDate
}

/** Shared notes validation. Returns the trimmed text, or null when empty. */
function validateNotes(raw: unknown): string | null {
  const notes = typeof raw === 'string' ? raw.trim() || null : null
  if (notes && notes.length > NOTES_MAX) {
    throw new BookingError(`Notes must be ${NOTES_MAX} characters or fewer.`, 400)
  }
  return notes
}

/** Confirms the service exists and is bookable, or throws a 404. */
async function assertServiceAvailable(serviceId: string): Promise<void> {
  const available = await db
    .select({ id: service.id })
    .from(service)
    .where(and(eq(service.id, serviceId), eq(service.isActive, true)))
    .limit(1)

  if (available.length === 0) {
    throw new BookingError('That service is not available.', 404)
  }
}

/**
 * Books one service for one day for one user — the signed-in customer
 * creating their own booking. Created `pending`, which is the state the admin
 * queue acts on.
 *
 * Validates the day locally (format, not past, not absurdly far), confirms the
 * service is real and active, then relies on `booking_active_unique_idx` to
 * reject a duplicate live booking for the same service on the same day —
 * surfacing it as a friendly 409 rather than a raw constraint error.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingDate = validateBookingDay(input.bookingDate)
  const notes = validateNotes(input.notes)

  await assertServiceAvailable(input.serviceId)

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

// ---------------------------------------------------------------------------
// Admin operations
//
// Everything below is behind `requireAdmin` (src/session-middleware.ts) — the
// routes in src/index.ts mount this as a sub-app with that middleware
// registered once, so no admin route can forget it. These functions
// themselves read from the same tables the customer path uses; the only
// difference is scope (all customers, not one).
// ---------------------------------------------------------------------------

/** A booking as the admin queue sees it: owner, contact and service joined. */
export interface AdminBooking extends Booking {
  /** Registered customer's id — null for a walk-in guest reservation. */
  userId: string | null
  /** Guest name for walk-ins — null for registered customers. */
  guestName: string | null
  /** Display name: the account name, or the guest name. Never empty. */
  customerName: string
  customerEmail: string | null
  customerContact: string | null
}

export type AdminBookingAction = 'confirm' | 'reject' | 'complete' | 'cancel'

/**
 * The only status moves an admin can make, and the states they are legal
 * from. Enforced in the UPDATE itself, so a stale queue tab cannot
 * double-apply an action.
 */
const ADMIN_ACTIONS: Record<AdminBookingAction, { from: BookingStatus[]; to: BookingStatus }> = {
  confirm: { from: ['pending'], to: 'confirmed' },
  reject: { from: ['pending'], to: 'rejected' },
  complete: { from: ['confirmed'], to: 'completed' },
  cancel: { from: ['pending', 'confirmed'], to: 'cancelled' },
}

const ACTION_PAST: Record<AdminBookingAction, BookingStatus> = {
  confirm: 'confirmed',
  reject: 'rejected',
  complete: 'completed',
  cancel: 'cancelled',
}

const GUEST_NAME_MAX = 120
const TAG_USERS_LIMIT = 20

const adminBookingColumns = {
  ...bookingColumns,
  userId: booking.userId,
  guestName: booking.guestName,
  customerName: user.name,
  customerEmail: user.email,
  customerContact: user.contactNum,
}

type AdminBookingRow = BookingRow & {
  userId: string | null
  guestName: string | null
  customerName: string | null
  customerEmail: string | null
  customerContact: string | null
}

function toAdminBooking(row: AdminBookingRow): AdminBooking {
  return {
    ...toBooking(row),
    userId: row.userId,
    guestName: row.guestName,
    customerName: row.guestName ?? row.customerName ?? 'Walk-in guest',
    customerEmail: row.customerEmail,
    customerContact: row.customerContact,
  }
}

async function findBookingByIdForAdmin(bookingId: string): Promise<AdminBooking | null> {
  const rows = await db
    .select(adminBookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .leftJoin(user, eq(user.id, booking.userId))
    .where(eq(booking.id, bookingId))
    .limit(1)

  const row = rows[0]
  return row ? toAdminBooking(row) : null
}

export interface ListBookingsFilter {
  status?: BookingStatus
  /** Exact day, `YYYY-MM-DD`. */
  date?: string
  /** Free-text match on reference code, customer name or email. */
  query?: string
}

/**
 * Every customer's bookings, oldest upcoming day first, pending ones on top —
 * the order the admin queue works through. Filters are applied in SQL so the
 * page never has to pull the whole table to narrow it.
 */
export async function listAllBookings(filter: ListBookingsFilter = {}): Promise<AdminBooking[]> {
  const conditions = []

  if (filter.status) {
    conditions.push(eq(booking.status, filter.status))
  }
  if (filter.date && ISO_DATE.test(filter.date)) {
    conditions.push(eq(booking.bookingDate, filter.date))
  }
  const query = filter.query?.trim()
  if (query) {
    const like = `%${query}%`
    conditions.push(
      or(
        ilike(booking.referenceCode, like),
        ilike(booking.guestName, like),
        ilike(user.name, like),
        ilike(user.email, like),
      ),
    )
  }

  const rows = await db
    .select(adminBookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .leftJoin(user, eq(user.id, booking.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      // Pending first (the queue), then earliest day, then newest request.
      sql`case when ${booking.status} = 'pending' then 0 else 1 end`,
      asc(booking.bookingDate),
      desc(booking.createdAt),
    )

  return rows.map(toAdminBooking)
}

export interface CreateBookingForOthersInput {
  /** Registered customer to book for — null when it's a guest reservation. */
  userId?: string | null
  /** Guest (walk-in / phone caller) name. Required when there's no userId. */
  guestName?: string
  serviceId: string
  bookingDate: string
  notes?: string
}

/**
 * Books a day for someone who is not behind the keyboard: either a tagged
 * registered customer (`userId`) or a guest name typed in by the admin
 * (`guestName`). One of the two is required — the booking_owner_check
 * constraint enforces the same rule in the database.
 *
 * Created `confirmed` rather than `pending`: the admin taking the
 * reservation IS the approval step, so sending it back to the queue it came
 * from would be circular.
 */
export async function createBookingForOthers(
  input: CreateBookingForOthersInput,
): Promise<AdminBooking> {
  const bookingDate = validateBookingDay(input.bookingDate)
  const notes = validateNotes(input.notes)

  const userId = input.userId?.trim() || null
  const guestName = input.guestName?.trim() || ''

  if (userId && guestName) {
    throw new BookingError(
      'Pick either a registered customer or a guest name — not both.',
      400,
    )
  }
  if (!userId && !guestName) {
    throw new BookingError('Pick a registered customer or type a guest name.', 400)
  }
  if (guestName.length > GUEST_NAME_MAX) {
    throw new BookingError(`Guest name must be ${GUEST_NAME_MAX} characters or fewer.`, 400)
  }

  if (userId) {
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (existing.length === 0) {
      throw new BookingError('That customer account does not exist.', 404)
    }
  }

  await assertServiceAvailable(input.serviceId)

  try {
    const inserted = await db
      .insert(booking)
      .values({
        id: randomUUID(),
        referenceCode: makeReferenceCode(),
        userId,
        guestName: userId ? null : guestName,
        serviceId: input.serviceId,
        bookingDate,
        status: 'confirmed',
        notes,
      })
      .returning({ id: booking.id })

    const insertedRow = inserted[0]
    if (!insertedRow) {
      throw new BookingError('The reservation could not be saved.', 400)
    }

    const created = await findBookingByIdForAdmin(insertedRow.id)
    if (!created) {
      throw new BookingError('The reservation could not be read back after saving.', 400)
    }
    return created
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Only booking_active_unique_idx applies to a tagged user; guest rows
      // never enter it, so this fires only for the registered-customer path.
      throw new BookingError(
        'That customer already has a live booking for this service on that day.',
        409,
      )
    }
    throw err
  }
}

/**
 * Moves one reservation through an admin transition (confirm / reject /
 * complete / cancel).
 *
 * The legal source states live in ADMIN_ACTIONS and are part of the UPDATE's
 * WHERE clause, so two admins acting on the same row cannot both win — the
 * loser gets a 409 that says which state blocked it. A zero-row result is
 * re-read to tell "does not exist" (404) apart from "already moved" (409).
 */
export async function adminSetBookingStatus(
  bookingId: string,
  action: AdminBookingAction,
): Promise<AdminBooking> {
  const transition = ADMIN_ACTIONS[action]

  const updated = await db
    .update(booking)
    .set({ status: transition.to, updatedAt: new Date() })
    .where(and(eq(booking.id, bookingId), inArray(booking.status, transition.from)))
    .returning({ id: booking.id })

  if (updated.length === 0) {
    const existing = await findBookingByIdForAdmin(bookingId)
    if (!existing) {
      throw new BookingError('That reservation does not exist.', 404)
    }
    throw new BookingError(
      `A ${existing.status} reservation cannot be ${ACTION_PAST[action]}.`,
      409,
    )
  }

  const result = await findBookingByIdForAdmin(bookingId)
  if (!result) {
    throw new BookingError('The reservation could not be read back after updating.', 400)
  }
  return result
}

/** Minimal identity for the "tag a customer" picker. */
export interface TagUser {
  id: string
  name: string
  email: string
}

/**
 * Registered accounts matching `query` (name or email), for the admin's
 * customer tag picker. Deliberately minimal — id, name, email — so the admin
 * UI never receives more account data than it displays.
 */
export async function listUsersForTagging(query?: string): Promise<TagUser[]> {
  const q = query?.trim()
  const like = q ? `%${q}%` : null

  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(like ? or(ilike(user.name, like), ilike(user.email, like)) : undefined)
    .orderBy(asc(user.name))
    .limit(TAG_USERS_LIMIT)
}
