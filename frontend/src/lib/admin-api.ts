import {
  request,
  type Booking,
  type BookingStatus,
} from './booking-api'

/**
 * Client for the admin API (backend/src/index.ts, mounted at /api/admin/*).
 *
 * Every route behind this module is gated by `requireAdmin` on the server —
 * 401 when signed out, 403 for a signed-in non-admin. The admin console is the
 * only caller, and it only renders for `role === 'admin'` — but that guard is
 * UX; these endpoints enforce access on their own. Same fetch/error policy as
 * the customer desk: see lib/booking-api.ts.
 */

/** A booking as the admin console sees it: owner, contact and service joined. */
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

/** The status moves a reservation can be taken through by an admin. */
export type AdminBookingAction = 'confirm' | 'reject' | 'complete' | 'cancel'

/** Minimal identity for the "tag a customer" picker. */
export interface TagUser {
  id: string
  name: string
  email: string
}

export interface AdminBookingFilters {
  status?: BookingStatus
  /** Exact day, `YYYY-MM-DD`. */
  date?: string
  /** Free-text match on reference code, customer name or email. */
  query?: string
}

export function fetchAdminBookings(
  filters: AdminBookingFilters = {},
): Promise<{ bookings: AdminBooking[]; studioToday: string }> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.date) params.set('date', filters.date)
  if (filters.query) params.set('query', filters.query)
  const queryString = params.toString()
  return request(`/api/admin/bookings${queryString ? `?${queryString}` : ''}`)
}

export function createAdminBooking(input: {
  /** Registered customer — omit when booking for a guest. */
  userId?: string
  /** Guest (walk-in / phone caller) name — omit when tagging a customer. */
  guestName?: string
  serviceId: string
  bookingDate: string
  notes?: string
}): Promise<{ booking: AdminBooking }> {
  return request('/api/admin/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function adminBookingAction(
  id: string,
  action: AdminBookingAction,
): Promise<{ booking: AdminBooking }> {
  return request(`/api/admin/bookings/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
  })
}

export function searchUsers(query: string): Promise<{ users: TagUser[] }> {
  const q = query.trim()
  return request(`/api/admin/users${q ? `?query=${encodeURIComponent(q)}` : ''}`)
}
