import { request } from './booking-api'
import { cached } from './cache'


export type MediaSection = 'video' | 'music' | 'radio'

export const MEDIA_SECTION_LABELS: Record<MediaSection, string> = {
  video: 'Video song',
  music: 'Music track',
  radio: 'Radio station',
}

export interface MediaItem {
  id: string
  section: MediaSection
  title: string
  subtitle: string | null
  artist: string | null
  tag: string | null
  duration: string | null
  plays: number | null
  tempo: string | null
  songKey: string | null
  freq: string | null
  listeners: number | null
  sourceUrl: string | null
  album: string | null
  coverUrl: string | null
  sortOrder: number
}

export interface AdminMediaItem extends MediaItem {
  lyrics: string | null
  sourceName: string | null
  coverName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function fetchMediaCatalog(): Promise<{ items: MediaItem[] }> {
  return cached('media', 60 * 1000, () => request('/api/media'))
}

export function formatCount(value: number): string {
  if (value < 1000) return String(value)

  const thousands = value / 1000
  if (Math.round(thousands) >= 1000) {
    return `${compact(value / 1_000_000)}M`
  }
  return `${compact(thousands)}K`
}

function compact(value: number): string {
  return value >= 100 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '')
}
