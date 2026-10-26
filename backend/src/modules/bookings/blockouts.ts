import { randomUUID } from 'node:crypto'
import { and, asc, eq, gte, inArray } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { booking, bookingBlockout } from '../../db/schema.ts'
import { cacheDel, cacheDelPrefix, cacheGet, cacheSet } from '../../shared/cache.ts'
import { uniqueViolationConstraint } from './shared.ts'
import {
  studioToday,
  validateBlockoutReason,
  validateBookingDay,
  validateNotes,
} from './validation.ts'
import {
  BookingError,
  type AdminBlockout,
  type CreateBlockoutInput,
  type PublicBlockout,
} from './types.ts'

/**
 * Admin-managed closed days.
 *
 * A blockout is a whole calendar day the studio will not accept new bookings
 * for (maintenance, a private event, a holiday…). It is deliberately separate
 * from `booking`: blocking a day never mutates or hides existing reservations,
 * and creating a blockout is refused while live (pending/confirmed) bookings
 * still sit on that day, so the admin resolves them first instead of silently
 * stranding customers.
 */

const blockoutColumns = {
  id: bookingBlockout.id,
  bookingDate: bookingBlockout.bookingDate,
  reason: bookingBlockout.reason,
  note: bookingBlockout.note,
  createdBy: bookingBlockout.createdBy,
  createdAt: bookingBlockout.createdAt,
}

type BlockoutRow = {
  id: string
  bookingDate: string
  reason: AdminBlockout['reason']
  note: string | null
  createdBy: string | null
  createdAt: Date
}

function toAdminBlockout(row: BlockoutRow): AdminBlockout {
  return { ...row, createdAt: row.createdAt.toISOString() }
}

function toPublicBlockout(row: Pick<BlockoutRow, 'bookingDate' | 'reason'>): PublicBlockout {
  // The note and creator stay internal — the customer only needs to know the
  // day is closed and, optionally, why.
  return { bookingDate: row.bookingDate, reason: row.reason }
}

/** Upcoming blocked days for the admin console, soonest first. */
export async function listBlockouts(from = studioToday()): Promise<AdminBlockout[]> {
  const key = `blockouts:admin:${from}`
  const cached = await cacheGet<AdminBlockout[]>(key)
  if (cached) return cached

  const rows = await db
    .select(blockoutColumns)
    .from(bookingBlockout)
    .where(gte(bookingBlockout.bookingDate, from))
    .orderBy(asc(bookingBlockout.bookingDate))

  const value = rows.map(toAdminBlockout)
  await cacheSet(key, value, 15)
  return value
}

/** Upcoming blocked days for the customer desk — no internal fields. */
export async function listPublicBlockouts(from = studioToday()): Promise<PublicBlockout[]> {
  const key = `blockouts:public:${from}`
  const cached = await cacheGet<PublicBlockout[]>(key)
  if (cached) return cached

  const rows = await db
    .select({ bookingDate: bookingBlockout.bookingDate, reason: bookingBlockout.reason })
    .from(bookingBlockout)
    .where(gte(bookingBlockout.bookingDate, from))
    .orderBy(asc(bookingBlockout.bookingDate))

  const value = rows.map(toPublicBlockout)
  await cacheSet(key, value, 30)
  return value
}

/** The blockout on `day`, if any — used by the writers and tests. */
export async function findBlockout(day: string): Promise<AdminBlockout | null> {
  const rows = await db
    .select(blockoutColumns)
    .from(bookingBlockout)
    .where(eq(bookingBlockout.bookingDate, day))
    .limit(1)

  const row = rows[0]
  return row ? toAdminBlockout(row) : null
}

/**
 * Blocks one day. Refuses while live bookings remain on it: the admin must
 * cancel/move them first, otherwise the day would be closed to new requests
 * while still holding promises the studio cannot keep.
 */
export async function createBlockout(input: CreateBlockoutInput): Promise<AdminBlockout> {
  const bookingDate = validateBookingDay(input.bookingDate)
  const reason = validateBlockoutReason(input.reason)
  const note = validateNotes(input.note)

  const live = await db
    .select({ id: booking.id })
    .from(booking)
    .where(
      and(
        eq(booking.bookingDate, bookingDate),
        inArray(booking.status, ['pending', 'confirmed']),
      ),
    )
    .limit(1)

  if (live.length > 0) {
    throw new BookingError(
      'That day still has live bookings. Cancel or move them before blocking it.',
      409,
    )
  }

  try {
    const inserted = await db
      .insert(bookingBlockout)
      .values({
        id: randomUUID(),
        bookingDate,
        reason,
        note,
        createdBy: input.createdBy,
      })
      .returning(blockoutColumns)

    const row = inserted[0]
    if (!row) {
      // An insert without a returning row is a server-side inconsistency.
      throw new Error('The blocked day insert returned no row.')
    }
    await cacheDelPrefix('blockouts:')
    return toAdminBlockout(row)
  } catch (err) {
    if (uniqueViolationConstraint(err) === 'booking_blockout_day_unique_idx') {
      throw new BookingError('That day is already blocked.', 409)
    }
    throw err
  }
}

/** Removes a blockout, reopening the day. */
export async function deleteBlockout(id: string): Promise<AdminBlockout> {
  const deleted = await db
    .delete(bookingBlockout)
    .where(eq(bookingBlockout.id, id))
    .returning(blockoutColumns)

  const row = deleted[0]
  if (!row) {
    throw new BookingError('That blocked day does not exist.', 404)
  }
  await cacheDelPrefix('blockouts:')
  return toAdminBlockout(row)
}

