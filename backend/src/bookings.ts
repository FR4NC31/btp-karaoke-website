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
 *
 * This file is the public barrel; the implementation lives in src/bookings/.
 */

export {
  ADMIN_ACTION_NAMES,
  BookingError,
  type AdminBooking,
  type AdminBookingAction,
  type Booking,
  type BookingStatus,
  type CreateBookingForOthersInput,
  type CreateBookingInput,
  type ListBookingsFilter,
  type Service,
  type TagUser,
} from './bookings/types.ts'

export { studioToday } from './bookings/shared.ts'
export { listServices } from './bookings/services.ts'
export { cancelBooking, createBooking, listBookingsForUser } from './bookings/customer.ts'
export {
  adminSetBookingStatus,
  createBookingForOthers,
  listAllBookings,
  listUsersForTagging,
} from './bookings/admin.ts'
