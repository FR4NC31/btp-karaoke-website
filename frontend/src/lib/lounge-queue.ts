import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { MediaItem } from './media-api'


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
  coverUrl: string | null
  src: string | null
  kind: 'video' | 'music'
  mediaId: string | null
}

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

export interface QueueSource {
  src: string | null
  kind: 'video' | 'music'
}

function titleKey(title: string): string {
  return title.trim().toLowerCase()
}

export function resolveQueueSource(row: QueueItem, catalog: MediaItem[]): QueueSource | null {
  const match =
    (row.mediaId !== null ? catalog.find((item) => item.id === row.mediaId) : undefined) ??
    catalog.find((item) => item.section !== 'radio' && titleKey(item.title) === titleKey(row.title))

  const src = match ? match.sourceUrl : row.src
  if (src) {
    const kind: 'video' | 'music' = match ? (match.section === 'music' ? 'music' : 'video') : row.kind
    return { src, kind }
  }
  if (match?.section === 'video') return { src: null, kind: 'video' }
  return null
}

export interface LoungeQueueApi {
  items: QueueItem[]
  add: (input: QueueInput) => void
  prepend: (input: QueueInput) => void
  remove: (id: string) => void
  clear: () => void
  move: (from: number, to: number) => void
}

const STORAGE_KEY = 'btp.lounge-queue'

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
    return seedQueue
  }
}

export function useLoungeQueueState(): LoungeQueueApi {
  const [items, setItems] = useState<QueueItem[]>(loadQueue)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      return
    }
  }, [items])

  const add = useCallback(
    (input: QueueInput) =>
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
    [],
  )
  const prepend = useCallback(
    (input: QueueInput) =>
      setItems((rows) => {
        const titleMatch = input.title.trim().toLowerCase()
        const filtered = rows.filter((row) => {
          if (input.mediaId && row.mediaId === input.mediaId) return false
          if (row.title.trim().toLowerCase() === titleMatch) return false
          return true
        })
        const newItem: QueueItem = {
          id: crypto.randomUUID(),
          title: input.title,
          artist: input.artist ?? '',
          genre: input.genre ?? '',
          len: input.len ?? '',
          tags: input.tags ?? [{ label: 'Playing', solid: true }],
          coverUrl: input.coverUrl ?? null,
          src: input.src ?? null,
          kind: input.kind ?? 'video',
          mediaId: input.mediaId ?? null,
        }
        return [newItem, ...filtered]
      }),
    [],
  )
  const remove = useCallback(
    (id: string) => setItems((rows) => rows.filter((row) => row.id !== id)),
    [],
  )
  const clear = useCallback(() => setItems([]), [])
  const move = useCallback(
    (from: number, to: number) =>
      setItems((rows) => {
        if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows
        const next = [...rows]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      }),
    [],
  )

  return useMemo(() => ({ items, add, prepend, remove, clear, move }), [items, add, prepend, remove, clear, move])
}

const LoungeQueueContext = createContext<LoungeQueueApi | null>(null)

export function LoungeQueueProvider({
  api,
  children,
}: {
  api: LoungeQueueApi
  children: ReactNode
}) {
  return createElement(LoungeQueueContext.Provider, { value: api }, children)
}

export function useLoungeQueue(): LoungeQueueApi {
  const api = useContext(LoungeQueueContext)
  if (!api) throw new Error('useLoungeQueue must be used inside the studio shell.')
  return api
}
