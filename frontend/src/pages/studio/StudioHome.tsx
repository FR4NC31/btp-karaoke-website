import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { MusicNote01Icon, Search01Icon, Video01Icon } from '@hugeicons/core-free-icons'
import { fetchMediaCatalog, type MediaItem } from '../../lib/media-api'
import VideoSongSection from './components/VideoSongSection'
import MusicPlayerSection from './components/MusicPlayerSection'
import RadioSection from './components/RadioSection'
import RadioTab from './components/RadioTab'
import StudioSkeleton from './components/StudioSkeleton'
import RecentlyPlayed from './components/home/RecentlyPlayed'
import PlaylistStrip from './components/home/PlaylistStrip'
import EmptyState from './components/EmptyState'

export default function StudioHome() {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

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

  // The top-bar search box owns ?q=; the sidebar's Video Songs / Music
  // Library rows deep-link ?filter= (no visible filter row since the redesign).
  const rawQuery = (searchParams.get('q') ?? '').trim()
  const query = rawQuery.toLowerCase()
  const filterParam = searchParams.get('filter')
  const filter =
    filterParam === 'ktv' || filterParam === 'music' || filterParam === 'radio'
      ? filterParam
      : 'all'

  const clearQuery = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const matchesQuery = (item: MediaItem) =>
    !query ||
    [item.title, item.subtitle, item.artist, item.tag].some((value) =>
      value?.toLowerCase().includes(query),
    )

  const video = items.filter((item) => item.section === 'video').filter(matchesQuery)
  const music = items.filter((item) => item.section === 'music').filter(matchesQuery)
  const radio = items.filter((item) => item.section === 'radio').filter(matchesQuery)

  const primaryAction =
    'rounded-lg bg-primary-soft bg-gradient-to-r from-primary to-primary-hover px-4 py-2 text-xs font-semibold text-text-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

  const emptyState = query ? (
    <EmptyState
      icon={Search01Icon}
      title={`No matches for “${rawQuery}”`}
      description="Try another title, artist or tag — or clear the search to see everything in this section."
      action={
        <button type="button" onClick={clearQuery} className={primaryAction}>
          Clear search
        </button>
      }
    />
  ) : (
    <EmptyState
      icon={filter === 'music' ? MusicNote01Icon : Video01Icon}
      title={
        filter === 'ktv'
          ? 'No video songs yet'
          : filter === 'music'
            ? 'No music tracks yet'
            : 'Nothing published yet'
      }
      description={
        filter === 'ktv'
          ? 'KTV video masters appear here the moment the studio publishes them.'
          : filter === 'music'
            ? 'Minus-one tracks appear here the moment the studio publishes them.'
            : 'Video songs and music tracks appear here the moment the studio publishes them.'
      }
      action={
        filter === 'all' ? undefined : (
          <Link to="/studio" className={primaryAction}>
            Back to the hub
          </Link>
        )
      }
    />
  )

  // Sidebar deep-links (?filter=ktv|music|radio) are the design's tab view: only that
  // section renders — no recently-played strip, no playlists or radio panels.
  if (filter !== 'all') {
    if (filter === 'radio') {
      return (
        <section id="catalog" aria-label="Catalog" className="space-y-8">
          {query && radio.length === 0 ? emptyState : <RadioTab items={radio} />}
        </section>
      )
    }
    const section = filter === 'ktv' ? video : music
    return (
      <section id="catalog" aria-label="Catalog" className="space-y-8">
        {section.length > 0 ? (
          filter === 'ktv' ? (
            <VideoSongSection items={section} />
          ) : (
            <MusicPlayerSection items={section} />
          )
        ) : (
          emptyState
        )}
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <RecentlyPlayed items={items} />

      <section id="catalog" aria-label="Catalog" className="space-y-8">
        {video.length > 0 && <VideoSongSection items={video} />}
        {music.length > 0 && <MusicPlayerSection items={music} />}
        {video.length === 0 && music.length === 0 && emptyState}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <PlaylistStrip />
        <RadioSection items={radio} />
      </div>
    </div>
  )
}
