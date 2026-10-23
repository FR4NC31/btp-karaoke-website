import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { db } from '../db.ts'
import { booking, service, user, type BookingStatus } from '../schema.ts'
import {
  assertServiceAvailable,
  bookingColumns,
  insertBookingRow,
  isRealCalendarDay,
  toBooking,
  uniqueViolationConstraint,
  validateBookingDay,
  validateBookingTime,
  validateNotes,
  type BookingRow,
} from './shared.ts'
import {
  BookingError,
  type AdminBooking,
  type AdminBookingAction,
  type CreateBookingForOthersInput,
  type ListBookingsFilter,
  type TagUser,
} from './types.ts'

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

/** db or a transaction — the read-back must see the same connection as the write. */
type BookingSelect = Pick<typeof db, 'select'>

async function findBookingByIdForAdmin(
  bookingId: string,
  executor: BookingSelect = db,
): Promise<AdminBooking | null> {
  const rows = await executor
    .select(adminBookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .leftJoin(user, eq(user.id, booking.userId))
    .where(eq(booking.id, bookingId))
    .limit(1)

  const row = rows[0]
  return row ? toAdminBooking(row) : null
}

/**
 * Escapes the wildcards in a user-supplied ILIKE pattern, so searching for
 * `50%` matches that literal text instead of every row. Postgres treats a
 * backslash as the default escape character inside a LIKE pattern.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
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
  const date = filter.date?.trim()
  // An impossible day (2027-02-30, 2027-13-01) would reach Postgres and fail as
  // an uncaught 500. Like any other unusable filter value, it is ignored — the
  // admin simply sees the unfiltered queue rather than an error page.
  if (date && isRealCalendarDay(date)) {
    conditions.push(eq(booking.bookingDate, date))
  }
  const query = filter.query?.trim()
  if (query) {
    const like = `%${escapeLike(query)}%`
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
  const bookingTime = validateBookingTime(input.bookingTime)
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
    const bookingId = await insertBookingRow({
      userId,
      guestName: userId ? null : guestName,
      serviceId: input.serviceId,
      bookingDate,
      bookingTime,
      status: 'confirmed',
      notes,
    })

    const created = await findBookingByIdForAdmin(bookingId)
    if (!created) {
      throw new Error('The reservation could not be read back after saving.')
    }
    return created
  } catch (err) {
    const constraint = uniqueViolationConstraint(err)
    if (constraint === 'booking_active_day_unique_idx') {
      // Applies to a tagged user; guest rows never enter these indexes, so
      // this fires only for the registered-customer path.
      throw new BookingError(
        'That customer already has a live booking for this service on that day.',
        409,
      )
    }
    if (constraint === 'booking_active_time_unique_idx') {
      // Slot-specific: another booking already exists at this exact time
      throw new BookingError(
        'That customer already has a booking for this service at this time slot.',
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

  // Write and read-back share one transaction: without it, the row returned
  // to the admin could be a later state written by another admin, or a
  // concurrent delete could turn a successful update into a 500.
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(booking)
      .set({ status: transition.to, updatedAt: new Date() })
      .where(and(eq(booking.id, bookingId), inArray(booking.status, transition.from)))
      .returning({ id: booking.id })

    if (updated.length === 0) {
      const existing = await findBookingByIdForAdmin(bookingId, tx)
      if (!existing) {
        throw new BookingError('That reservation does not exist.', 404)
      }
      throw new BookingError(
        `A ${existing.status} reservation cannot be ${ACTION_PAST[action]}.`,
        409,
      )
    }

    const result = await findBookingByIdForAdmin(bookingId, tx)
    if (!result) {
      throw new Error('The reservation could not be read back after updating.')
    }
    return result
  })
}

/**
 * Registered accounts matching `query` (name or email), for the admin's
 * customer tag picker. Deliberately minimal — id, name, email — so the admin
 * UI never receives more account data than it displays.
 */
export async function listUsersForTagging(query?: string): Promise<TagUser[]> {
  const q = query?.trim()
  const like = q ? `%${escapeLike(q)}%` : null

  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(like ? or(ilike(user.name, like), ilike(user.email, like)) : undefined)
    .orderBy(asc(user.name))
    .limit(TAG_USERS_LIMIT)
}
