import { useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  MusicNote01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import type { ActivityLogEntry, ActivityTone } from './activity-log-data'

const TONE_STYLES: Record<ActivityTone, { badge: string; dot: string }> = {
  primary: {
    badge: 'border-primary/40 bg-primary-soft text-primary',
    dot: 'bg-primary',
  },
  success: {
    badge: 'border-success/40 bg-success/10 text-success',
    dot: 'bg-success',
  },
  warning: {
    badge: 'border-warning/40 bg-warning/10 text-warning',
    dot: 'bg-warning',
  },
  error: {
    badge: 'border-error/40 bg-error/10 text-error',
    dot: 'bg-error',
  },
  muted: {
    badge: 'border-border bg-surface-elevated text-text-muted',
    dot: 'bg-text-muted',
  },
}

type ActivityLogProps = {
  entries: ActivityLogEntry[]
  onRefresh?: () => void | Promise<void>
}

/**
 * Studio Operations & Activity Log — the dashboard's audit trail.
 *
 * Rows are derived from real reservations (see activity-log-data.ts); the
 * refresh control re-reads the same snapshot the rest of the page uses, so the
 * feed can never disagree with the queue.
 */
export default function ActivityLog({ entries, onRefresh }: ActivityLogProps) {
  const [refreshing, setRefreshing] = useState(false)
  const empty = entries.length === 0

  async function handleRefresh() {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <section
      aria-labelledby="activity-log-heading"
      className="@container flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={MusicNote01Icon} size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="activity-log-heading"
                className="font-heading text-xl font-bold tracking-wide uppercase"
              >
                Studio Operations &amp; Activity Log
              </h2>
              <span className="inline-flex items-center gap-1 rounded border border-success/40 bg-success/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-success uppercase">
                <span className="size-1.5 rounded-full bg-success" />
                Live Feed
              </span>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Real-time reservation status updates, master streamloads, and studio logs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={!onRefresh || refreshing}
          aria-label="Refresh activity log"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            size={15}
            className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined}
          />
        </button>
      </div>

      {empty ? (
        <div className="m-5 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-elevated/40 p-10 text-center">
          <HugeiconsIcon icon={MusicNote01Icon} size={30} className="text-text-muted" />
          <h3 className="font-heading text-base font-bold tracking-wide text-text-primary">
            No activity yet
          </h3>
          <p className="text-xs text-text-muted">
            Reservations and studio updates will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[520px] text-center">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/40">
                {[
                  'Activity / Type',
                  'Title / Artist / Details',
                  'User / Engineer',
                  'Timestamp & Target',
                  'Status',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`px-4 py-3 text-center text-[9px] font-bold tracking-[0.16em] text-text-muted uppercase ${
                      heading === 'User / Engineer' || heading === 'Timestamp & Target'
                        ? 'hidden @5xl:table-cell'
                        : ''
                    }`}
                  >
                    {heading}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[9px] font-bold tracking-[0.16em] text-text-muted uppercase"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {entries.map((entry) => {
                const tone = TONE_STYLES[entry.typeTone]
                const statusTone = TONE_STYLES[entry.statusTone]

                return (
                  <tr
                    key={entry.id}
                    className="group transition hover:bg-surface-elevated/40"
                  >
                    <td className="px-4 py-3.5 align-middle text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[9px] font-bold tracking-widest uppercase ${tone.badge}`}
                      >
                        <HugeiconsIcon icon={entry.typeIcon} size={11} />
                        {entry.typeLabel}
                      </span>
                    </td>
                    <td className="max-w-64 px-4 py-3.5 align-middle text-center">
                      <p className="truncate text-[13px] font-semibold text-text-primary">
                        {entry.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {entry.details}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-text-muted @5xl:hidden">
                        <span className="truncate">{entry.user}</span>
                        <span className="truncate">{entry.timestamp}</span>
                      </p>
                    </td>
                    <td className="hidden px-4 py-3.5 align-middle text-center @5xl:table-cell">
                      <p className="text-[13px] text-text-secondary">{entry.user}</p>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {entry.userMeta}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3.5 align-middle text-center @5xl:table-cell">
                      <p className="text-[13px] text-text-secondary">{entry.timestamp}</p>
                      <p className="mt-0.5 text-[11px] text-text-muted">{entry.schedule}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone.badge}`}
                      >
                        <span className={`size-1.5 rounded-full ${statusTone.dot}`} />
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right align-middle">
                      <Link
                        to="/admin/bookings"
                        aria-label={`View ${entry.title}`}
                        title="View reservations"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
                      >
                        <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
