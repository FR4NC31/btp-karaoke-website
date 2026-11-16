import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { HistoryIcon } from '@hugeicons/core-free-icons'
import type { KaraokeVideoApi } from '../../lib/karaoke-player'
import { fetchMediaCatalog, type MediaItem } from '../../lib/media-api'
import { filterHistory, usePlayHistory, type HistoryFilter } from '../../lib/play-history'
import { HistoryBody, HistoryToolbar } from './components/history/HistoryParts'

export default function HistoryPage() {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const { entries, error, clear, retry } = usePlayHistory()
  const player = useOutletContext<KaraokeVideoApi>()
  const count = entries ? filterHistory(entries, filter).length : 0
  const totalCount = entries?.length ?? 0

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
        setItems([])
       setLoadError(err instanceof Error ? err.message : 'Could not load the media catalog.')      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={HistoryIcon} size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">
                Listening History
              </h1>
              <span className="rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                {count} {count === 1 ? 'track' : 'tracks'}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-xs text-text-muted">
              Everything you have played in the studio, most recent first — filter it, heart
              a track, or send it straight back to the rehearsal deck.
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <HistoryToolbar count={count} totalCount={totalCount} filter={filter} onFilter={setFilter} onClear={clear} />
        </div>
      </div>

      {loadError && (
        <p
          role="alert"
          className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {loadError}
        </p>
      )}

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-error/40 bg-error/10 px-4 py-4 text-xs text-error"
        >
          <p className="flex-1">Your listening history could not be read from this browser.</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg border border-error/40 px-3 py-1.5 font-semibold"
          >
            Retry
          </button>
        </div>
      ) : items === null ? (
        <div role="status" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <span className="sr-only">Loading listening history</span>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-xl bg-surface-elevated/60"
            />
          ))}
        </div>
      ) : (
        <HistoryBody
          entries={entries}
          filter={filter}
          items={items}
          player={player}
          render={(cards) => (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {cards}
            </div>
          )}
        />
      )}
    </div>
  )
}
