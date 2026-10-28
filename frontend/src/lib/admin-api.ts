import {
  request,
  type AdminBlockout,
  type BlockoutReason,
  type Booking,
  type BookingStatus,
} from './booking-api'
import type { AdminMediaItem, MediaSection } from './media-api'
import { invalidate } from './cache'

export type { AdminBlockout, BlockoutReason }


export interface AdminBooking extends Booking {
  userId: string | null
  guestName: string | null
  customerName: string
  customerEmail: string | null
  customerContact: string | null
}

export type AdminBookingAction = 'confirm' | 'reject' | 'complete' | 'cancel'

export interface TagUser {
  id: string
  name: string
  email: string
}

export interface AdminBookingFilters {
  status?: BookingStatus
  date?: string
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
  userId?: string
  guestName?: string
  serviceId: string
  bookingDate: string
  bookingTime?: string | null
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

/**
 * Payment decision for a pending booking. Unlike the generic confirm/reject,
 * this resets the customer's failure streak on approval and escalates the
 * booking suspension on rejection.
 */
export function adminPaymentAction(
  id: string,
  action: 'approve' | 'reject',
): Promise<{ booking: AdminBooking }> {
  return request(`/api/admin/bookings/${encodeURIComponent(id)}/${action}-payment`, {
    method: 'POST',
  })
}

export function fetchGcashQr(): Promise<{ url: string | null }> {
  return request('/api/settings/gcash-qr')
}

export function setGcashQrUrl(url: string): Promise<{ url: string }> {
  return request('/api/admin/settings/gcash-qr', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export type MembershipTier = 'free' | 'subscriber' | 'vip'

export function searchUsers(query: string): Promise<{ users: TagUser[] }> {
  const q = query.trim()
  return request(`/api/admin/users${q ? `?query=${encodeURIComponent(q)}` : ''}`)
}

export function fetchUserMembership(
  userId: string,
): Promise<{
  membership: {
    tier: MembershipTier
    expiresAt: string | null
    suspendedUntil: string | null
    failureCount: number
  }
}> {
  return request(`/api/admin/users/${encodeURIComponent(userId)}/membership`)
}

/** Admin reset for a customer's booking ban. */
export function clearUserBookingSuspension(userId: string): Promise<{ ok: boolean }> {
  return request(`/api/admin/users/${encodeURIComponent(userId)}/clear-suspension`, {
    method: 'POST',
  })
}

export function setUserMembership(
  userId: string,
  tier: MembershipTier,
  expiresAt: string | null,
): Promise<{ membership: { tier: MembershipTier; expiresAt: string | null } }> {
  return request(`/api/admin/users/${encodeURIComponent(userId)}/membership`, {
    method: 'POST',
    body: JSON.stringify({ tier, expiresAt }),
  })
}

export function fetchAdminBlockouts(): Promise<{
  blockouts: AdminBlockout[]
  studioToday: string
}> {
  return request('/api/admin/blockouts')
}

export function createAdminBlockout(input: {
  bookingDate: string
  reason?: BlockoutReason | ''
  note?: string
}): Promise<{ blockout: AdminBlockout }> {
  return request<{ blockout: AdminBlockout }>('/api/admin/blockouts', {
    method: 'POST',
    body: JSON.stringify({
      bookingDate: input.bookingDate,
      reason: input.reason || null,
      note: input.note?.trim() || undefined,
    }),
  }).then((result) => {
    invalidate('blockouts')
    return result
  })
}

export function deleteAdminBlockout(id: string): Promise<{ blockout: AdminBlockout }> {
  return request<{ blockout: AdminBlockout }>(`/api/admin/blockouts/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
  }).then((result) => {
    invalidate('blockouts')
    return result
  })
}


export interface AdminMediaInput {
  section: MediaSection
  title: string
  subtitle?: string
  artist?: string
  tag?: string
  duration?: string
  plays?: number | null
  tempo?: string
  songKey?: string
  freq?: string
  listeners?: number | null
  sourceUrl?: string | null
  sourceName?: string | null
  album?: string
  lyrics?: string
  coverUrl?: string | null
  coverName?: string | null
}

function mediaPayload(input: AdminMediaInput): Record<string, unknown> {
  const clean = (value: string | undefined) => {
    const text = value?.trim()
    return text ? text : undefined
  }
  return {
    section: input.section,
    title: input.title.trim(),
    subtitle: clean(input.subtitle),
    artist: clean(input.artist),
    tag: clean(input.tag),
    duration: clean(input.duration),
    plays: input.plays ?? undefined,
    tempo: clean(input.tempo),
    songKey: clean(input.songKey),
    freq: clean(input.freq),
    listeners: input.listeners ?? undefined,
    sourceUrl: input.sourceUrl ?? null,
    sourceName: clean(input.sourceName ?? undefined),
    album: clean(input.album),
    lyrics: clean(input.lyrics),
    coverUrl: input.coverUrl ?? null,
    coverName: clean(input.coverName ?? undefined),
  }
}

export function fetchAdminMedia(section?: MediaSection): Promise<{ items: AdminMediaItem[] }> {
  const query = section ? `?section=${encodeURIComponent(section)}` : ''
  return request(`/api/admin/media${query}`)
}

export function createAdminMediaItem(input: AdminMediaInput): Promise<{ item: AdminMediaItem }> {
  return request<{ item: AdminMediaItem }>('/api/admin/media', {
    method: 'POST',
    body: JSON.stringify(mediaPayload(input)),
  }).then((result) => {
    invalidate('media')
    return result
  })
}

export function updateAdminMediaItem(
  id: string,
  input: AdminMediaInput,
): Promise<{ item: AdminMediaItem }> {
  return request<{ item: AdminMediaItem }>(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(mediaPayload(input)),
  }).then((result) => {
    invalidate('media')
    return result
  })
}

export function adminMediaVisibility(
  id: string,
  isActive: boolean,
): Promise<{ item: AdminMediaItem }> {
  return request<{ item: AdminMediaItem }>(`/api/admin/media/${encodeURIComponent(id)}/visibility`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  }).then((result) => {
    invalidate('media')
    return result
  })
}

export function adminMediaMove(
  id: string,
  direction: 'up' | 'down',
): Promise<{ item: AdminMediaItem }> {
  return request<{ item: AdminMediaItem }>(`/api/admin/media/${encodeURIComponent(id)}/move`, {
    method: 'POST',
    body: JSON.stringify({ direction }),
  }).then((result) => {
    invalidate('media')
    return result
  })
}

export function deleteAdminMediaItem(id: string): Promise<{ item: AdminMediaItem }> {
  return request<{ item: AdminMediaItem }>(`/api/admin/media/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
  }).then((result) => {
    invalidate('media')
    return result
  })
}

export interface MediaUpload {
  url: string
  name: string
  size: number
}

export function uploadAdminMediaFile(file: File): Promise<{ file: MediaUpload }> {
  return request('/api/admin/media/upload', {
    method: 'POST',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
  })
}

export async function discardAdminMediaUpload(url: string): Promise<void> {
  try {
    await request('/api/admin/media/upload/discard', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  } catch {
    return
  }
}
