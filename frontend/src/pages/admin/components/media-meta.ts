import type { IconSvgElement } from '@hugeicons/react'
import {
  MusicNote01Icon,
  PlayIcon,
  Radio01Icon,
} from '@hugeicons/core-free-icons'
import { formatCount, type AdminMediaItem, type MediaSection } from '../../../lib/media-api'

export const SECTION_ICONS: Record<MediaSection, IconSvgElement> = {
  video: PlayIcon,
  music: MusicNote01Icon,
  radio: Radio01Icon,
}

/** Section-tinted wash behind covers that have no uploaded art. */
export const SECTION_COVER_GRADIENT: Record<MediaSection, string> = {
  video: 'bg-gradient-to-br from-primary/30 via-surface-elevated to-surface',
  music: 'bg-gradient-to-br from-success/20 via-surface-elevated to-surface',
  radio: 'bg-gradient-to-br from-warning/20 via-surface-elevated to-surface',
}

/** Count-chip word per section: "4 ITEMS", "4 TRACKS", "3 STREAMS". */
export const SECTION_COUNT_WORD: Record<MediaSection, [singular: string, plural: string]> = {
  video: ['Item', 'Items'],
  music: ['Track', 'Tracks'],
  radio: ['Stream', 'Streams'],
}

export function sectionCountLabel(section: MediaSection, count: number): string {
  const [singular, plural] = SECTION_COUNT_WORD[section]
  return `${count} ${count === 1 ? singular : plural}`
}

/** The text metadata line shown on both the grid card and the list row. */
export function metaParts(item: AdminMediaItem): string[] {
  const parts: string[] = []
  if (item.section === 'video') {
    if (item.duration) parts.push(item.duration)
    if (item.plays !== null) parts.push(`${formatCount(item.plays)} plays`)
  } else if (item.section === 'music') {
    if (item.album) parts.push(item.album)
    if (item.duration) parts.push(item.duration)
    if (item.tempo) parts.push(item.tempo)
    if (item.songKey) parts.push(`Key ${item.songKey}`)
  } else {
    if (item.freq) parts.push(item.freq)
    if (item.listeners !== null) parts.push(`${formatCount(item.listeners)} listeners`)
  }
  return parts
}

/**
 * Play is offered wherever a playback source exists: video falls back to the
 * bundled master even without an uploaded file, music needs its own sourceUrl,
 * and radio rows never expose play here.
 */
export function canPreview(item: AdminMediaItem): boolean {
  return item.section === 'video' || (item.section === 'music' && item.sourceUrl !== null)
}
