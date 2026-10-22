import { useEffect, useMemo, useState } from 'react'
import { fetchMediaCatalog, type MediaItem } from '../../../../lib/media-api'

let cachedCatalog: MediaItem[] | null = null

export async function loadPlaylistCatalog(): Promise<MediaItem[]> {
  if (cachedCatalog) return cachedCatalog
  const result = await fetchMediaCatalog()
  cachedCatalog = result.items
  return result.items
}

function titleKey(value: string): string {
  return value.trim().toLowerCase()
}

export function matchMediaItem(
  title: string,
  mediaId: string | null,
  catalog: MediaItem[],
): MediaItem | null {
  return (
    (mediaId !== null ? catalog.find((item) => item.id === mediaId) : undefined) ??
    catalog.find(
      (item) => item.section !== 'radio' && titleKey(item.title) === titleKey(title),
    ) ??
    null
  )
}

export function usePlaylistCatalog() {
  const [items, setItems] = useState<MediaItem[] | null>(cachedCatalog)

  useEffect(() => {
    if (items) return
    let alive = true
    loadPlaylistCatalog()
      .then((result) => {
        if (alive) setItems(result)
      })
      .catch(() => {
        if (alive) setItems([])
      })
    return () => {
      alive = false
    }
  }, [items])

  const byTitle = useMemo(() => {
    const map = new Map<string, MediaItem>()
    for (const item of items ?? []) {
      if (item.section === 'radio') continue
      const key = titleKey(item.title)
      if (!map.has(key)) map.set(key, item)
    }
    return map
  }, [items])

  return {
    items: items ?? [],
    byTitle,
    loaded: items !== null,
  }
}
