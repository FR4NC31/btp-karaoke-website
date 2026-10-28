import { useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  EyeIcon,
  CalendarCheck01Icon,
} from '@hugeicons/core-free-icons'
import type { AdminBooking } from '../../../../lib/admin-api'
import { activityEntriesFrom, type ActivityTone } from './activity-log-data'

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

type PendingApprovalsProps = {
  pending: AdminBooking[]
  today: AdminBooking[]
  onOpen: (booking: AdminBooking) => void
}

/**
 * Pending Approvals / Today Switcher — switchable panel between pending approvals
 * and today at the studio items, styled identically to the activity log.
 */
export default function PendingApprovals({
  pending,
  today,
  onOpen,
}: PendingApprovalsProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'today'>('pending')

  const currentList = activeTab === 'pending' ? pending : today
  const empty = currentList.length === 0
  const entries = activityEntriesFrom(currentList, currentList.length).map((entry) => ({
    ...entry,
    status: activeTab === 'pending' ? 'Pending' : entry.status,
  }))

  return (
    <section
      aria-labelledby="pending-approvals-heading"
      className="@container flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
            <HugeiconsIcon
              icon={activeTab === 'pending' ? Clock01Icon : CalendarCheck01Icon}
              size={18}
            />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="pending-approvals-heading"
                className="font-heading text-xl font-bold tracking-wide uppercase"
              >
                {activeTab === 'pending' ? 'Pending Approvals' : 'Today at the Studio'}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
                  empty
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-warning/40 bg-warning/10 text-warning'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${empty ? 'bg-success' : 'bg-warning'}`}
                />
                {empty ? 'All clear' : `${currentList.length} items`}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              {activeTab === 'pending'
                ? 'Confirm or reject the reservations waiting on the desk.'
                : 'Active and scheduled sessions for today at the studio.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-elevated p-1">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              aria-pressed={activeTab === 'pending'}
              className={`rounded-md px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition ${
                activeTab === 'pending'
                  ? 'bg-primary text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              aria-pressed={activeTab === 'today'}
              className={`rounded-md px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition ${
                activeTab === 'today'
                  ? 'bg-primary text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Today ({today.length})
            </button>
          </div>

          <Link
            to="/admin/bookings"
            aria-label="All reservations"
            title="All reservations"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} />
          </Link>
        </div>
      </div>

      {empty ? (
        <div className="m-5 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-elevated/40 p-10 text-center">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} className="text-success" />
          <h3 className="font-heading text-base font-bold tracking-wide text-text-primary">
            {activeTab === 'pending' ? 'No pending approvals' : 'No sessions booked for today'}
          </h3>
          <p className="text-xs text-text-muted">
            {activeTab === 'pending'
              ? 'Every reservation has been confirmed or rejected. New requests will appear here.'
              : "Today's studio schedule is currently clear."}
          </p>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/40">
                {[
                  'Title / Artist / Details',
                  'User / Engineer',
                  'Timestamp & Target',
                  'Status',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`px-4 py-3 text-[9px] font-bold tracking-[0.16em] text-text-muted uppercase ${
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
                const statusTone = TONE_STYLES[entry.statusTone]

                return (
                  <tr
                    key={entry.id}
                    className="group transition hover:bg-surface-elevated/40"
                  >
                    <td className="max-w-64 px-4 py-3.5 align-middle">
                      <p className="truncate text-[13px] font-semibold text-text-primary">
                        {entry.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {entry.details}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-text-muted @5xl:hidden">
                        <span className="truncate">{entry.user}</span>
                        <span className="truncate">{entry.schedule}</span>
                      </p>
                    </td>
                    <td className="hidden px-4 py-3.5 align-middle @5xl:table-cell">
                      <p className="text-[13px] text-text-secondary">{entry.user}</p>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {entry.userMeta}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3.5 align-middle @5xl:table-cell">
                      <p className="text-[13px] text-text-secondary">{entry.timestamp}</p>
                      <p className="mt-0.5 text-[11px] text-text-muted">{entry.schedule}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone.badge}`}
                      >
                        <span className={`size-1.5 rounded-full ${statusTone.dot}`} />
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => onOpen(entry.booking)}
                        aria-label={`View ${entry.booking.referenceCode}`}
                        title="View details & receipt"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
                      >
                        <HugeiconsIcon icon={EyeIcon} size={13} />
                      </button>
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
