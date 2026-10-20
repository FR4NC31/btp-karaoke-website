import { useEffect, useState } from 'react'
import { fetchMediaCatalog, type MediaItem } from '../../lib/media-api'
import VideoSongSection from './components/VideoSongSection'
import MusicPlayerSection from './components/MusicPlayerSection'
import RadioSection from './components/RadioSection'
import StudioSkeleton from './components/StudioSkeleton'

export default function StudioHome() {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const result = await fetchMediaCatalog()
        if (!alive) return
        setItems(result.items)
        setLoadError('')
      } catch (err) {
        if (!alive) return
        setLoadError(err instanceof Error ? err.message : 'Could not load the media hub.')
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  if (loadError) {
    return (
      <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
        {loadError}
      </p>
    )
  }

  if (!items) {
    return <StudioSkeleton />
  }

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-6">
        <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">Media Hub</h1>
        <p className="mt-2 text-sm text-text-muted">
          The studio has not published anything yet — video songs, minus-one tracks and radio
          stations appear here as they go live.
        </p>
      </section>
    )
  }

  const video = items.filter((item) => item.section === 'video')
  const music = items.filter((item) => item.section === 'music')
  const radio = items.filter((item) => item.section === 'radio')

  return (
    <div className="space-y-8">
      {video.length === 0 && <h1 className="sr-only">Media Hub</h1>}
      <VideoSongSection items={video} />
      <MusicPlayerSection items={music} />
      <RadioSection items={radio} />
    </div>
  )
}
