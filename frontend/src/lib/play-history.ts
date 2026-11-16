import { useCallback, useEffect, useReducer, useSyncExternalStore } from 'react'
import type { PreviewItem } from '../components/console/types'
import type { MediaItem } from './media-api'

/** The slice of a track the transport reports when it goes on air. */
export interface PlayableTrack {
  title: string
  subtitle: string
  src: string
  coverUrl: string | null
  kind: 'video' | 'music'
  mediaId?: string | null
  album?: string | null
  tag?: string | null
  duration?: string | null
}

export interface HistoryEntry {
  id: string
  title: string
  artist: string
  kind: 'video' | 'music'
  coverUrl: string | null
  duration: string | null
  /** Genre-ish label: the catalog has no genre column, so album (else tag). */
  category: string | null
  mediaId: string | null
  src: string | null
  playedAt: number
}

export type HistoryFilter = 'all' | 'video' | 'music'

const STORAGE_KEY = 'btp.play-history'
const MAX_ENTRIES = 60
// Pause/resume and loop restarts re-fire `play`; only a genuine later listen
// should move the track back to the front of the list.
const DEDUPE_MS = 90_000

let cache: HistoryEntry[] | null = null
let failed = false
const listeners = new Set<() => void>()

function isEntry(value: unknown): value is HistoryEntry {
  const row = value as HistoryEntry
  return Boolean(row && typeof row.title === 'string' && typeof row.playedAt === 'number')
}

function load(): HistoryEntry[] {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    cache = Array.isArray(parsed) ? parsed.filter(isEntry) : []
    failed = false
  } catch {
    // Corrupt or blocked storage: surface the error instead of pretending
    // the user simply has no history.
    cache = []
    failed = true
  }
  return cache
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache ?? []))
    failed = false
  } catch {
    failed = true
  }
}

function emit() {
  listeners.forEach((listener) => listener())
}

/** Called by the transport on every real `play` of a track. */
export function recordPlay(track: PlayableTrack) {
  if (!track.title) return
  const now = Date.now()
  const rows = load()
  const id = track.mediaId ?? `${track.title}::${track.subtitle}`.trim().toLowerCase()
  const newest = rows[0]
  if (newest && newest.id === id && now - newest.playedAt < DEDUPE_MS) return
  const entry: HistoryEntry = {
    id,
    title: track.title,
    artist: track.subtitle,
    kind: track.kind,
    coverUrl: track.coverUrl,
    duration: track.duration ?? null,
    category: track.album ?? track.tag ?? null,
    mediaId: track.mediaId ?? null,
    src: track.src || null,
    playedAt: now,
  }
  cache = [entry, ...rows.filter((row) => row.id !== id)].slice(0, MAX_ENTRIES)
  persist()
  emit()
}

export function clearHistory() {
  cache = []
  persist()
  emit()
}

export function retryHistory() {
  cache = null
  failed = false
  load()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): HistoryEntry[] | null {
  return cache
}

function getErrorSnapshot(): boolean {
  return failed
}

/**
 * Reads the store after mount (not during render) so the UI can show a real
 * loading state for the storage read.
 */
export function usePlayHistory() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const error = useSyncExternalStore(subscribe, getErrorSnapshot, getErrorSnapshot)
  const [, forceRender] = useReducer((tick: number) => tick + 1, 0)

  useEffect(() => {
    if (getSnapshot() === null) {
      load()
      forceRender()
    }
  }, [])

  const clear = useCallback(() => clearHistory(), [])
  const retry = useCallback(() => retryHistory(), [])

  return { entries, error, clear, retry }
}

export function filterHistory(entries: HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  if (filter === 'all') return entries
  return entries.filter((entry) => entry.kind === filter)
}

/** "Just now" / "18m ago" / "3h ago" / "Yesterday" / "2d ago". */
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function relativePlayTime(playedAt: number): string {
  const elapsed = Math.max(0, Date.now() - playedAt)
  if (elapsed < MINUTE) return 'Just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 2 * DAY) return 'Yesterday'
  return `${Math.floor(elapsed / DAY)}d ago`
}

/** True when the transport is currently playing this history row. */
export function isActivePlayback(
  onAir: PlayableTrack | null,
  entry: Pick<HistoryEntry, 'mediaId' | 'title' | 'kind'>,
): boolean {
  if (!onAir) return false
  if (onAir.mediaId && entry.mediaId) return onAir.mediaId === entry.mediaId
  return (
    onAir.kind === entry.kind &&
    onAir.title.trim().toLowerCase() === entry.title.trim().toLowerCase()
  )
}

/**
 * Re-resolve a row against the live catalog so a rebuilt bundle hash or a
 * re-tagged row never sends the console to a stale URL. Falls back to what
 * was recorded when the track has since been removed from the hub.
 */
export function resolveHistoryItem(entry: HistoryEntry, catalog: MediaItem[]): PreviewItem {
  const match = entry.mediaId ? catalog.find((item) => item.id === entry.mediaId) : undefined
  if (match) return match
  return {
    id: entry.mediaId ?? entry.id,
    section: entry.kind,
    title: entry.title,
    subtitle: null,
    artist: entry.artist,
    tag: null,
    duration: entry.duration,
    plays: null,
    tempo: null,
    songKey: null,
    freq: null,
    listeners: null,
    sourceUrl: entry.src,
    album: entry.category,
    coverUrl: entry.coverUrl,
    sortOrder: 0,
  }
}
