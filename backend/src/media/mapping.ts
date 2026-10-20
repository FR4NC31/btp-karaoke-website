import { mediaItem } from '../schema.ts'
import type { MediaItem, MediaSection, PublicMediaItem } from './types.ts'

type MediaRow = typeof mediaItem.$inferSelect

export function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    section: row.section as MediaSection,
    title: row.title,
    subtitle: row.subtitle,
    artist: row.artist,
    tag: row.tag,
    duration: row.duration,
    plays: row.plays,
    tempo: row.tempo,
    songKey: row.songKey,
    freq: row.freq,
    listeners: row.listeners,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    album: row.album,
    lyrics: row.lyrics,
    coverUrl: row.coverUrl,
    coverName: row.coverName,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toPublicMediaItem(item: MediaItem): PublicMediaItem {
  return {
    id: item.id,
    section: item.section,
    title: item.title,
    subtitle: item.subtitle,
    artist: item.artist,
    tag: item.tag,
    duration: item.duration,
    plays: item.plays,
    tempo: item.tempo,
    songKey: item.songKey,
    freq: item.freq,
    listeners: item.listeners,
    sourceUrl: item.sourceUrl,
    album: item.album,
    coverUrl: item.coverUrl,
    sortOrder: item.sortOrder,
  }
}
