import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { HistoryIcon } from '@hugeicons/core-free-icons'
import type { KaraokeVideoApi } from '../../../../lib/karaoke-player'
import type { MediaItem } from '../../../../lib/media-api'
import { filterHistory, usePlayHistory, type HistoryFilter } from '../../../../lib/play-history'
import { HistoryBody, HistoryToolbar } from '../history/HistoryParts'

const DESCRIPTION =
  'Jump straight back into your recent studio masters, KTV sessions, and rehearsal tracks.'

export default function RecentlyPlayed({ items }: { items: MediaItem[] }) {
  const { entries, error, clear, retry } = usePlayHistory()
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const player = useOutletContext<KaraokeVideoApi>()
  const count = entries ? filterHistory(entries, filter).length : 0
  const totalCount = entries?.length ?? 0

  return (
    <section
      aria-labelledby="recently-played-heading"
      className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5"
      style={{
        backgroundImage:
          'radial-gradient(55% 130% at 100% 0%, rgba(211,47,47,0.14), transparent 62%)',
      }}
    >
      <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={HistoryIcon} size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id="recently-played-heading"
                className="text-xl leading-tight font-bold font-sans"
              >
                Recently Played
              </h1>
              <span className="rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                {count} {count === 1 ? 'track' : 'tracks'}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">{DESCRIPTION}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <HistoryToolbar
            count={count}
            totalCount={totalCount}
            filter={filter}
            onFilter={setFilter}
            onClear={clear}
            showViewAll
          />
        </div>
      </div>

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
      ) : (
        <HistoryBody
          entries={entries}
          filter={filter}
          items={items}
          player={player}
          render={(cards) => (
            // Native horizontal rail: six cards fit on desktop, smaller widths
            // scroll. Hidden scrollbar keeps the panel chrome clean.
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&>*]:w-44 [&>*]:shrink-0 [&>*]:snap-start [&::-webkit-scrollbar]:hidden">
              {cards}
            </div>
          )}
        />
      )}
    </section>
  )
}
