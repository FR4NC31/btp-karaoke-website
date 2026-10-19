import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import type { MediaItem } from './media-api'

/**
 * The lounge queue: one "up next" list shared by the studio hub and the
 * player-queue console.
 *
 * The studio shell owns the state and hands it to the routed pages through
 * the outlet context (same pattern as the karaoke transport), so a card's
 * "Add to queue" on /studio lands in the same list the console renders —
 * add, remove, clear and drag-reorder all drive those rows. The list
 * persists to localStorage, so it survives a reload; the first visit seeds
 * the mockup rows. There is no API yet — nothing is sent to the backend.
 *
 * A row only knows what it can play through `resolveQueueSource`: the file
 * captured when it was queued, or the live catalog row its title/media id
 * points at. Rows nothing resolves for (the mock seeds, hand-typed entries,
 * rows whose upload was deleted) are skipped by the console's skips — the
 * queue plays exact songs or nothing, never a stand-in.
 */

export interface QueueTag {
  label: string
  solid?: boolean
}

export interface QueueItem {
  id: string
  title: string
  artist: string
  genre: string
  len: string
  tags: QueueTag[]
  /** Catalog cover for rows added from the hub; null = the default art. */
  coverUrl: string | null
  /** Uploaded file behind the row; null → the console's bundled master. */
  src: string | null
  /** Which stage mode the row plays in (video songs vs minus-one tracks). */
  kind: 'video' | 'music'
  /** Catalog row this was queued from; null on seeds / hand-typed rows. */
  mediaId: string | null
}

/** What `add` takes — the id is generated and tags default to "Queued". */
export interface QueueInput {
  title: string
  artist?: string
  genre?: string
  len?: string
  coverUrl?: string | null
  src?: string | null
  kind?: 'video' | 'music'
  mediaId?: string | null
  tags?: QueueTag[]
}

/**
 * The resolved playback target of a queue row: the exact file it must play,
 * or the bundled video master (`src: null`) for catalog video songs that
 * ship without an upload — the same convention the hub's play links use.
 */
export interface QueueSource {
  src: string | null
  kind: 'video' | 'music'
}

/** Case/whitespace-insensitive title key — rows without a media id match by it. */
function titleKey(title: string): string {
  return title.trim().toLowerCase()
}

/**
 * Work out what a row actually plays, in trust order: the live catalog row
 * it was queued from (by media id, then by exact title — this heals rows
 * queued before ids were stored, and follows file replacements made in the
 * admin), then the file captured at queue time, then the bundled master for
 * catalog video songs. `null` = nothing real behind the row: the console
 * skips it rather than playing a stand-in under its name.
 */
export function resolveQueueSource(row: QueueItem, catalog: MediaItem[]): QueueSource | null {
  const match =
    (row.mediaId !== null ? catalog.find((item) => item.id === row.mediaId) : undefined) ??
    catalog.find((item) => item.section !== 'radio' && titleKey(item.title) === titleKey(row.title))

  const src = match?.sourceUrl ?? row.src
  if (src) {
    const kind: 'video' | 'music' = match ? (match.section === 'music' ? 'music' : 'video') : row.kind
    return { src, kind }
  }
  if (match?.section === 'video') return { src: null, kind: 'video' }
  return null
}

export interface LoungeQueueApi {
  /** Up-next rows in play order — the console renders them as ranks. */
  items: QueueItem[]
  /** Append a row; duplicates are fine, a song can be queued twice. */
  add: (input: QueueInput) => void
  remove: (id: string) => void
  clear: () => void
  /** Move the row at `from` to `to` — powers the console's drag-reorder. */
  move: (from: number, to: number) => void
}

/** One queue per browser — mockup scope, no per-user storage yet. */
const STORAGE_KEY = 'btp.lounge-queue'

/** Rows a first-time visitor sees until they add or clear something. */
const seedQueue: QueueItem[] = [
  {
    id: 'die-with-a-smile',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    genre: 'Pop',
    len: '4:11',
    tags: [{ label: 'playing', solid: true }],
    coverUrl: null,
    src: null,
    kind: 'video',
    mediaId: null,
  },
  {
    id: 'espresso',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    genre: 'Solo',
    len: '2:55',
    tags: [{ label: 'Next', solid: true }],
    coverUrl: null,
    src: null,
    kind: 'video',
    mediaId: null,
  },
  {
    id: 'beautiful-things',
    title: 'Beautiful Things',
    artist: 'Benson Boone',
    genre: 'Solo',
    len: '3:00',
    tags: [{ label: 'Rock' }, { label: 'Ballad' }],
    coverUrl: null,
    src: null,
    kind: 'video',
    mediaId: null,
  },
  {
    id: 'lovely',
    title: 'Lovely',
    artist: 'Billie Eilish & Khalid',
    genre: 'Duet',
    len: '3:20',
    tags: [{ label: 'Duet' }],
    coverUrl: null,
    src: null,
    kind: 'video',
    mediaId: null,
  },
]

/**
 * Storage is hand-editable, so every stored row is normalized before it
 * reaches the console (a missing `tags` array would crash the render).
 */
function toQueueItem(value: unknown): QueueItem | null {
  if (typeof value !== 'object' || value === null) return null
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.title !== 'string') return null

  return {
    id: row.id,
    title: row.title,
    artist: typeof row.artist === 'string' ? row.artist : '',
    genre: typeof row.genre === 'string' ? row.genre : '',
    len: typeof row.len === 'string' ? row.len : '',
    tags: Array.isArray(row.tags)
      ? row.tags.flatMap((tag): QueueTag[] => {
          if (typeof tag !== 'object' || tag === null) return []
          const { label, solid } = tag as Record<string, unknown>
          if (typeof label !== 'string') return []
          return [{ label, solid: solid === true }]
        })
      : [],
    coverUrl: typeof row.coverUrl === 'string' ? row.coverUrl : null,
    src: typeof row.src === 'string' ? row.src : null,
    kind: row.kind === 'music' ? 'music' : 'video',
    mediaId: typeof row.mediaId === 'string' ? row.mediaId : null,
  }
}

/** The stored queue, or the seed rows when there is nothing usable yet. */
function loadQueue(): QueueItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return seedQueue
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedQueue
    return parsed.flatMap((row): QueueItem[] => {
      const item = toQueueItem(row)
      return item ? [item] : []
    })
  } catch {
    // Private mode or corrupt JSON: fall back to a fresh queue.
    return seedQueue
  }
}

/**
 * Shell-side state (StudioShell): reads the stored queue once, then mirrors
 * every change back to localStorage.
 */
export function useLoungeQueueState(): LoungeQueueApi {
  const [items, setItems] = useState<QueueItem[]>(loadQueue)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Private mode / quota: the queue still works for this session.
    }
  }, [items])

  return {
    items,
    add: (input) =>
      setItems((rows) => [
        ...rows,
        {
          id: crypto.randomUUID(),
          title: input.title,
          artist: input.artist ?? '',
          genre: input.genre ?? '',
          len: input.len ?? '',
          tags: input.tags ?? [{ label: 'Queued' }],
          coverUrl: input.coverUrl ?? null,
          src: input.src ?? null,
          kind: input.kind ?? 'video',
          mediaId: input.mediaId ?? null,
        },
      ]),
    remove: (id) => setItems((rows) => rows.filter((row) => row.id !== id)),
    clear: () => setItems([]),
    move: (from, to) =>
      setItems((rows) => {
        if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows
        const next = [...rows]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      }),
  }
}

/** Studio pages read the shared queue through the shell's outlet context. */
export function useLoungeQueue(): LoungeQueueApi {
  return useOutletContext<LoungeQueueApi>()
}
