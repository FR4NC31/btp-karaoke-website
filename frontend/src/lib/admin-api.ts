import {
  request,
  type Booking,
  type BookingStatus,
} from './booking-api'
import type { AdminMediaItem, MediaSection } from './media-api'

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

// ---------------------------------------------------------------------------
// Media hub catalog (/admin/media)
// ---------------------------------------------------------------------------

/** The editor's field set. Empty strings and nulls clear the column. */
export interface AdminMediaInput {
  section: MediaSection
  title: string
  subtitle?: string
  /** Performer shown under the title; read from the file's tags. */
  artist?: string
  tag?: string
  duration?: string
  plays?: number | null
  tempo?: string
  songKey?: string
  freq?: string
  listeners?: number | null
  /** Upload reference from uploadAdminMediaFile; null removes the file. */
  sourceUrl?: string | null
  /** Original filename of that upload. */
  sourceName?: string | null
  /** Album/collection as shown on the hub. */
  album?: string
  /** Track lyrics — multi-line text; blank clears them. */
  lyrics?: string
  /** Cover image reference from uploadAdminMediaFile; null removes it. */
  coverUrl?: string | null
  /** Original filename of the cover upload. */
  coverName?: string | null
}

/** Blank text boxes are sent as "missing" so the backend stores null. */
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
    // Unlike the text columns, an explicit null here is meaningful: it tells
    // the backend to detach (and delete) the row's uploaded file. Same for
    // the cover below.
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
  return request('/api/admin/media', {
    method: 'POST',
    body: JSON.stringify(mediaPayload(input)),
  })
}

export function updateAdminMediaItem(
  id: string,
  input: AdminMediaInput,
): Promise<{ item: AdminMediaItem }> {
  return request(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(mediaPayload(input)),
  })
}

export function adminMediaVisibility(
  id: string,
  isActive: boolean,
): Promise<{ item: AdminMediaItem }> {
  return request(`/api/admin/media/${encodeURIComponent(id)}/visibility`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  })
}

export function adminMediaMove(
  id: string,
  direction: 'up' | 'down',
): Promise<{ item: AdminMediaItem }> {
  return request(`/api/admin/media/${encodeURIComponent(id)}/move`, {
    method: 'POST',
    body: JSON.stringify({ direction }),
  })
}

export function deleteAdminMediaItem(id: string): Promise<{ item: AdminMediaItem }> {
  return request(`/api/admin/media/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
  })
}

/** One stored upload as /api/admin/media/upload answers it. */
export interface MediaUpload {
  /** Public URL to attach to a catalog row (`/api/uploads/media/...`). */
  url: string
  /** Original filename, kept as the row's display copy. */
  name: string
  size: number
}

/**
 * Streams one MP4/MP3 to the backend — raw-body POST with the file itself as
 * the body (X-File-Name carries the display name), so large videos never sit
 * in memory. The editor calls this first and saves the returned url on the
 * row; the file is deleted server-side when the row replaces or drops it.
 *
 * X-File-Name is percent-encoded: header values are byte strings, so raw
 * characters above U+00FF (curly quotes, en dashes, CJK, emoji) make fetch
 * reject the header before sending. The backend decodes it.
 */
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

/**
 * Best-effort cleanup for an upload the editor made but then could not save
 * on a row, so a failed save does not leak the file. The backend refuses to
 * delete an upload some row still references, which makes a lost response
 * safe. Failure here is swallowed: a leaked file beats hiding the save error.
 */
export async function discardAdminMediaUpload(url: string): Promise<void> {
  try {
    await request('/api/admin/media/upload/discard', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  } catch {
    // Orphaned file; the next successful save replaces it anyway.
  }
}
