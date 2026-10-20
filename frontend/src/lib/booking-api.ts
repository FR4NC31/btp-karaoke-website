
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
  bookingDate: string
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
  let response: Response
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
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

  if (payload === null) {
    throw new BookingApiError('The server returned an empty response.', response.status)
  }

  return payload as T
}

export function fetchServices(): Promise<{ services: Service[]; studioToday: string }> {
  return request('/api/services')
}

export function fetchBookings(): Promise<{ bookings: Booking[]; studioToday: string }> {
  return request('/api/bookings')
}

export function createBooking(input: {
  serviceId: string
  bookingDate: string
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
