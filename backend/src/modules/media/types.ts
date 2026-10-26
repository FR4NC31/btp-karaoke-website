export type MediaSection = 'video' | 'music' | 'radio'

export interface MediaItem {
  id: string
  section: MediaSection
  title: string
  subtitle: string | null
  /** Performer — the file's artist tag or the admin's copy; null hides the line. */
  artist: string | null
  tag: string | null
  duration: string | null
  plays: number | null
  tempo: string | null
  songKey: string | null
  freq: string | null
  listeners: number | null
  /** Uploaded MP4/MP3 this row plays; null = bundled master (video) / none (music). */
  sourceUrl: string | null
  /** Original filename of the upload — admin display only. */
  sourceName: string | null
  /** Album/collection as shown on the hub, or null to hide it. */
  album: string | null
  /**
   * Optional track lyrics — multi-line plain text typed or pasted in the
   * admin editor (music rows). Null when the admin wrote none.
   */
  lyrics: string | null
  /** Uploaded cover image shown on the card/stage; null = default art. */
  coverUrl: string | null
  /** Original filename of the cover upload — admin display only. */
  coverName: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * The public hub payload — no admin bookkeeping fields, and no lyrics: the
 * text is staff-only (the admin editor and console read it through
 * /api/admin/media), so an unauthenticated /api/media read cannot scrape it.
 */
export type PublicMediaItem = Omit<
  MediaItem,
  'isActive' | 'createdAt' | 'updatedAt' | 'sourceName' | 'coverName' | 'lyrics'
>

/** Thrown for anything the route should turn into a specific HTTP status. */
export class MediaError extends Error {
  readonly status: 400 | 404

  constructor(message: string, status: 400 | 404) {
    super(message)
    this.name = 'MediaError'
    this.status = status
  }
}

