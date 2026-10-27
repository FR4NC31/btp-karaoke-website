import type { BookingBlockoutReason, BookingStatus } from '../../db/schema.ts'

export type { BookingBlockoutReason, BookingStatus }

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
  /** Whole day, `YYYY-MM-DD`. */
  bookingDate: string
  /** Optional time slot `HH:MM:SS` for per-hour services. NULL = per-day booking. */
  bookingTime: string | null
  status: BookingStatus
  notes: string | null
  createdAt: string
}

/** Thrown for anything the route should turn into a specific HTTP status. */
export class BookingError extends Error {
  readonly status: 400 | 403 | 404 | 409

  constructor(message: string, status: 400 | 403 | 404 | 409) {
    super(message)
    this.name = 'BookingError'
    this.status = status
  }
}

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

/**
 * The admin status moves, in the order the console offers them. Exported so the
 * route handler validates the URL segment against the same list the transition
 * table is built from — the two drifted silently before.
 */
export const ADMIN_ACTION_NAMES = ['confirm', 'reject', 'complete', 'cancel'] as const

export type AdminBookingAction = (typeof ADMIN_ACTION_NAMES)[number]

export interface ListBookingsFilter {
  status?: BookingStatus
  /** Exact day, `YYYY-MM-DD`. */
  date?: string
  /** Free-text match on reference code, customer name or email. */
  query?: string
}

export interface CreateBookingInput {
  userId: string
  serviceId: string
  bookingDate: string
  /** Optional time slot `HH:MM` for per-hour services. Omit for per-day bookings. */
  bookingTime?: string | null
  notes?: string
  paymentMethod?: 'filler' | 'gcash'
  receiptUrl?: string
}

export interface CreateBookingForOthersInput {
  /** Registered customer to book for — null when it's a guest reservation. */
  userId?: string | null
  /** Guest (walk-in / phone caller) name. Required when there's no userId. */
  guestName?: string
  serviceId: string
  bookingDate: string
  /** Optional time slot `HH:MM` for per-hour services. Omit for per-day bookings. */
  bookingTime?: string | null
  notes?: string
  paymentMethod?: 'filler' | 'gcash'
  receiptUrl?: string
}

/** Minimal identity for the "tag a customer" picker. */
export interface TagUser {
  id: string
  name: string
  email: string
}

/**
 * A blocked day as the booking desk sees it. Deliberately narrow: customers
 * learn *that* the studio is closed and the reason label, never the internal
 * note or which admin created it.
 */
export interface PublicBlockout {
  /** Whole day, `YYYY-MM-DD`. */
  bookingDate: string
  /** NULL = no reason given. */
  reason: BookingBlockoutReason | null
}

/** A blocked day as the admin console sees it. */
export interface AdminBlockout extends PublicBlockout {
  id: string
  /** Admin-only context; never sent to the customer desk. */
  note: string | null
  createdBy: string | null
  createdAt: string
}

export interface CreateBlockoutInput {
  bookingDate: string
  reason?: string | null
  note?: string
  /** Admin account creating the block. */
  createdBy: string
}

