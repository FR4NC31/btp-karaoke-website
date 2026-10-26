/**
 * Service catalog + day bookings, on Drizzle.
 *
 * "Assigning a service to a user" is what a booking row IS — the join between
 * the two, pinned to a calendar day. The service table never references a
 * user. See src/schema.ts for the tables and the ownership split with
 * better-auth_migrations/.
 *
 * A booking claims one calendar day; per-hour services also carry a start
 * time (`bookingTime`, migration 0008). `durationDays` is catalog metadata
 * (turnaround), not a claim on extra days.
 *
 * This file is the public barrel; the implementation lives in src/bookings/. */

export {
  ADMIN_ACTION_NAMES,
  BookingError,
  type AdminBlockout,
  type AdminBooking,
  type AdminBookingAction,
  type Booking,
  type BookingBlockoutReason,
  type BookingStatus,
  type CreateBlockoutInput,
  type CreateBookingForOthersInput,
  type CreateBookingInput,
  type ListBookingsFilter,
  type PublicBlockout,
  type Service,
  type TagUser,
} from './types.ts'

export { blockoutReasonLabel, studioToday } from './validation.ts'
export { listServices } from './services.ts'
export {
  createBlockout,
  deleteBlockout,
  listBlockouts,
  listPublicBlockouts,
} from './blockouts.ts'
export { cancelBooking, createBooking, listBookingsForUser } from './customer.ts'
export {
  adminSetBookingStatus,
  createBookingForOthers,
  listAllBookings,
  listUsersForTagging,
} from './admin.ts'

