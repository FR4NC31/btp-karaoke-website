import { request } from './booking-api'

/**
 * Client for the media hub catalog (backend/src/media.ts, served at
 * /api/media).
 *
 * The hub itself only reads; the admin console manages rows through the
 * functions in lib/admin-api.ts — the same read/write split as bookings
 * (lib/booking-api.ts vs lib/admin-api.ts).
 */

export type MediaSection = 'video' | 'music' | 'radio'

/** Section labels for pickers and the admin list. */
export const MEDIA_SECTION_LABELS: Record<MediaSection, string> = {
  video: 'Video song',
  music: 'Music track',
  radio: 'Radio station',
}

/** One hub card, as /api/media returns it (no admin bookkeeping fields). */
export interface MediaItem {
  id: string
  section: MediaSection
  title: string
  subtitle: string | null
  /** Performer — shown under the title on the card/console; null hides it. */
  artist: string | null
  tag: string | null
  /** Video/music: runtime as shown, e.g. "3:54" — read off the uploaded file. */
  duration: string | null
  /** Video: display-only play count. */
  plays: number | null
  /** Music: tempo as shown, e.g. "118 BPM". */
  tempo: string | null
  /** Music: musical key as shown, e.g. "Fmaj". */
  songKey: string | null
  /** Radio: dial position as shown, e.g. "FM 91.5". */
  freq: string | null
  /** Radio: display-only listener count. */
  listeners: number | null
  /**
   * The uploaded MP4/MP3 this card plays, when the admin attached one
   * (`/api/uploads/media/...`). Null on video rows plays the bundled local
   * master; null on music rows means the card carries no player yet.
   */
  sourceUrl: string | null
  /** Album/collection shown in the music meta strip; null hides it. */
  album: string | null
  /**
   * Uploaded cover image / video thumbnail for the card artwork
   * (`/api/uploads/media/...`); null = the default art.
   */
  coverUrl: string | null
  sortOrder: number
}

/** The admin console's view — adds the moderation fields. */
export interface AdminMediaItem extends MediaItem {
  /**
   * Track lyrics (multi-line); null when none were written. Staff-only: the
   * public /api/media payload omits the field entirely.
   */
  lyrics: string | null
  /** Original filename of the attached upload, for the editor's display. */
  sourceName: string | null
  /** Original filename of the cover upload, for the editor's display. */
  coverName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** The public hub catalog: active rows, already section-ordered. */
export function fetchMediaCatalog(): Promise<{ items: MediaItem[] }> {
  return request('/api/media')
}

/** 12400 → "12.4K" — the compact form the hub meta strip uses. */
export function formatCount(value: number): string {
  if (value < 1000) return String(value)
  const compact = value / 1000
  return `${compact >= 100 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, '')}K`
}
