/**
 * Client for the booking API (backend/src/index.ts).
 *
 * Plain `fetch` to same-origin `/api/*`, which Vite proxies to the Hono
 * backend — the session cookie rides along without CORS, exactly like the
 * Better Auth client. Errors are normalised into `BookingApiError` so the page
 * can render `err.message` directly instead of digging through a Response.
 *
 * `request` and `BookingApiError` are also the base the admin client
 * (lib/admin-api.ts) builds on — one error shape and one fetch policy for the
 * whole booking surface.
 */

import { cached } from './cache'

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

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

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

export class BookingApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'BookingApiError'
    this.status = status
  }
}

/**
 * One readable message for anything the booking surface can throw. Shared by
 * the customer desk and the admin console so a session expiry reads the same
 * in both.
 */
export function describeBookingError(err: unknown, fallback: string): string {
  if (err instanceof BookingApiError) {
    if (err.status === 401) {
      return 'Your session has expired. Sign in again to continue.'
    }
    if (err.status === 403) {
      return 'You do not have access to that.'
    }
    return err.message
  }
  return err instanceof Error ? err.message : fallback
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers,
    })
  } catch {
    // fetch only rejects when the request never completed — server down,
    // offline, DNS. Worth its own message; a 500 answers instead.
    throw new BookingApiError('Cannot reach the server. Check your connection and try again.', 0)
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? `Request failed (${response.status}).`
    throw new BookingApiError(message, response.status)
  }

  // 204 No Content is a valid empty success — the upload-discard cleanup
  // answers with one. Every other 2xx from this surface must carry JSON; an
  // empty or unparseable body there is a broken server, not a success.
  // Returning null used to surface later as a crash on destructuring, far from
  // the cause.
  if (response.status === 204) {
    return undefined as T
  }
  if (payload === null) {
    throw new BookingApiError('The server returned an empty response.', response.status)
  }

  return payload as T
}

export function fetchServices(): Promise<{ services: Service[]; studioToday: string }> {
  return cached('services', 5 * 60 * 1000, () => request('/api/services'))
}

export function fetchBookings(): Promise<{ bookings: Booking[]; studioToday: string }> {
  return request('/api/bookings')
}

export function createBooking(input: {
  serviceId: string
  bookingDate: string
  bookingTime?: string | null
  notes?: string
}): Promise<{ booking: Booking }> {
  return request('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function cancelBooking(id: string): Promise<{ booking: Booking }> {
  return request(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
}

/** True when the service is billed per hour or minute (needs a time slot),
 *  false when it is billed per day / per song / per plan (date-only booking). */
export function isTimeBasedService(service: Service): boolean {
  const unit = (service.unit ?? '').toLowerCase()
  return /\b(hour|hr|minute|min)(?:ly|s)?\b/.test(unit)
}

/** True when the service is billed by the hour, so slots must start on the
 *  hour (14:00, not 14:30). Minute-based services keep any `HH:MM`. */
export function isHourlyService(service: Service): boolean {
  const unit = (service.unit ?? '').toLowerCase()
  return /\b(hour|hr)(?:ly|s)?\b/.test(unit)
}

export const BLOCKOUT_REASONS = ['unavailable', 'maintenance', 'other'] as const

export type BlockoutReason = (typeof BLOCKOUT_REASONS)[number]

export const BLOCKOUT_REASON_LABELS: Record<BlockoutReason, string> = {
  unavailable: 'Unavailable',
  maintenance: 'Maintenance',
  other: 'Other',
}

/** A closed day as the booking desk sees it (no internal note/creator). */
export interface PublicBlockout {
  bookingDate: string
  reason: BlockoutReason | null
}

/** A closed day as the admin console sees it. */
export interface AdminBlockout extends PublicBlockout {
  id: string
  note: string | null
  createdBy: string | null
  createdAt: string
}

export function blockoutReasonLabel(reason: BlockoutReason | null): string | null {
  return reason ? BLOCKOUT_REASON_LABELS[reason] : null
}

export function fetchBlockouts(): Promise<{
  blockouts: PublicBlockout[]
  studioToday: string
}> {
  return cached('blockouts', 30 * 1000, () => request('/api/bookings/blockouts'))
}
