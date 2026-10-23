import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMediaCatalog, type MediaItem } from '../../../../lib/media-api'

let cachedCatalog: MediaItem[] | null = null
let catalogRequest: Promise<MediaItem[]> | null = null

export async function loadPlaylistCatalog(): Promise<MediaItem[]> {
  if (cachedCatalog) return cachedCatalog
  if (!catalogRequest) {
    catalogRequest = fetchMediaCatalog()
      .then((result) => {
        cachedCatalog = result.items
        return result.items
      })
      .catch((error: unknown) => {
        catalogRequest = null
        throw error
      })
  }
  return catalogRequest
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (items) return
    let alive = true
    loadPlaylistCatalog()
      .then((result) => {
        if (!alive) return
        setItems(result)
        setError(null)
      })
      .catch((reason: unknown) => {
        if (!alive) return
        setItems([])
        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not load the media catalog for playlists.',
        )
      })
    return () => {
      alive = false
    }
  }, [items])

  const retry = useCallback(() => {
    setError(null)
    setItems(null)
  }, [])

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
    error,
    retry,
  }
}
