import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Delete01Icon,
  PencilEdit01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import {
  adminMediaMove,
  adminMediaVisibility,
  deleteAdminMediaItem,
  fetchAdminMedia,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import {
  MEDIA_SECTION_LABELS,
  formatCount,
  type AdminMediaItem,
  type MediaSection,
} from '../../lib/media-api'

/**
 * /admin/media — the media hub catalog behind /studio.
 *
 * Rows are grouped by section in hub order (video → music → radio). Every
 * action is a POST to /api/admin/media/*: hide/show pulls a row from the
 * public feed without deleting it, move swaps it with its neighbour, edit
 * opens the full editor, and delete is permanent — so it asks first (the
 * delete icon turns into a Confirm/Cancel pair; the row's uploaded file is
 * deleted with it). The list reloads after every action — the server owns
 * the order, so the buttons' edge states (first row can't move up, last
 * can't move down) always follow the reload.
 */

const SECTION_ORDER: MediaSection[] = ['video', 'music', 'radio']

const STATUS_STYLES: Record<'live' | 'hidden', string> = {
  live: 'border-success/40 bg-success/10 text-success',
  hidden: 'border-border bg-surface-elevated text-text-muted',
}

/** The meta strip under a row — only the columns its section actually uses. */
function metaParts(item: AdminMediaItem): string[] {
  const parts: string[] = []
  if (item.section === 'video') {
    if (item.duration) parts.push(item.duration)
    if (item.plays !== null) parts.push(`${formatCount(item.plays)} plays`)
  } else if (item.section === 'music') {
    if (item.duration) parts.push(item.duration)
    if (item.tempo) parts.push(item.tempo)
    if (item.songKey) parts.push(`Key ${item.songKey}`)
  } else {
    if (item.freq) parts.push(item.freq)
    if (item.listeners !== null) parts.push(`${formatCount(item.listeners)} listeners`)
  }
  return parts
}

function RowButton({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border border-border bg-surface-elevated p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'text-text-secondary hover:border-error/50 hover:text-error'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

export default function AdminMedia() {
  const [items, setItems] = useState<AdminMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')
  // Delete is permanent, so it is a two-step: the icon arms confirmation for
  // one row at a time, Confirm runs the delete, Cancel (or any other action)
  // disarms it.
  const [confirmingId, setConfirmingId] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      try {
        const result = await fetchAdminMedia()
        if (!alive) return
        setItems(result.items)
        setLoadError('')
      } catch (err) {
        if (!alive) return
        setLoadError(describeBookingError(err, 'Could not load the media catalog.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  async function reload() {
    const result = await fetchAdminMedia()
    setItems(result.items)
  }

  async function handleVisibility(item: AdminMediaItem) {
    if (actingId) return
    setActingId(item.id)
    setConfirmingId('')
    setFlash('')
    try {
      const { item: updated } = await adminMediaVisibility(item.id, !item.isActive)
      setFlash(`${updated.title} is now ${updated.isActive ? 'live' : 'hidden'}.`)
      await reload()
    } catch (err) {
      setLoadError(describeBookingError(err, 'The item could not be updated.'))
    } finally {
      setActingId('')
    }
  }

  async function handleMove(item: AdminMediaItem, direction: 'up' | 'down') {
    if (actingId) return
    setActingId(item.id)
    setConfirmingId('')
    setFlash('')
    try {
      await adminMediaMove(item.id, direction)
      setFlash(`${item.title} moved ${direction}.`)
      await reload()
    } catch (err) {
      setLoadError(describeBookingError(err, 'The item could not be moved.'))
    } finally {
      setActingId('')
    }
  }

  async function handleDelete(item: AdminMediaItem) {
    if (actingId) return
    setActingId(item.id)
    setFlash('')
    try {
      await deleteAdminMediaItem(item.id)
      setFlash(`${item.title} removed.`)
      await reload()
    } catch (err) {
      setLoadError(describeBookingError(err, 'The item could not be removed.'))
    } finally {
      setActingId('')
      setConfirmingId('')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">Media Hub</h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">
            Video songs, minus-one tracks and radio stations
          </p>
        </div>
        <Link
          to="/admin/media/new"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover"
        >
          + New item
        </Link>
      </header>

      {loadError && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </p>
      )}

      {flash && (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
          {flash}
        </p>
      )}

      {loading ? (
        <p role="status" className="text-sm text-text-muted">
          Loading the catalog…
        </p>
      ) : (
        <div className="space-y-6">
          {SECTION_ORDER.map((section) => {
            const sectionItems = items.filter((item) => item.section === section)
            return (
              <section key={section}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-lg font-bold tracking-wide uppercase">
                    {MEDIA_SECTION_LABELS[section]}s
                  </h2>
                  <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                    {sectionItems.length} row{sectionItems.length === 1 ? '' : 's'}
                  </span>
                </div>

                {sectionItems.length === 0 ? (
                  <p className="text-sm text-text-muted">No items in this section yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {sectionItems.map((item, index) => {
                      const busy = actingId === item.id
                      const parts = metaParts(item)
                      return (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="font-heading text-base font-bold tracking-wide uppercase">
                                {item.title}
                              </p>
                              {item.tag && (
                                <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                                  {item.tag}
                                </span>
                              )}
                              {item.sourceUrl && (
                                <span
                                  title={item.sourceName ?? undefined}
                                  className="rounded border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary uppercase"
                                >
                                  {item.sourceUrl.endsWith('.mp3') ? 'MP3 file' : 'MP4 file'}
                                </span>
                              )}
                              {item.coverUrl && (
                                <span
                                  title={item.coverName ?? undefined}
                                  className="rounded border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary uppercase"
                                >
                                  Cover
                                </span>
                              )}
                              <span
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${
                                  item.isActive ? STATUS_STYLES.live : STATUS_STYLES.hidden
                                }`}
                              >
                                {item.isActive ? 'Live' : 'Hidden'}
                              </span>
                            </div>
                            {/* Under the title: the artist, else the
                                subtitle (music description, radio genre). */}
                            {(item.artist ?? item.subtitle) && (
                              <p className="mt-1.5 text-sm text-text-secondary">
                                {item.artist ?? item.subtitle}
                              </p>
                            )}
                            {parts.length > 0 && (
                              <p className="mt-1 text-[11px] tracking-widest text-text-muted uppercase">
                                {parts.join(' · ')}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <RowButton
                              label={`Move ${item.title} up`}
                              disabled={busy || index === 0}
                              onClick={() => handleMove(item, 'up')}
                            >
                              <HugeiconsIcon icon={ArrowUp01Icon} size={13} />
                            </RowButton>
                            <RowButton
                              label={`Move ${item.title} down`}
                              disabled={busy || index === sectionItems.length - 1}
                              onClick={() => handleMove(item, 'down')}
                            >
                              <HugeiconsIcon icon={ArrowDown01Icon} size={13} />
                            </RowButton>
                            <RowButton
                              label={item.isActive ? `Hide ${item.title}` : `Show ${item.title}`}
                              disabled={busy}
                              onClick={() => handleVisibility(item)}
                            >
                              <HugeiconsIcon
                                icon={item.isActive ? ViewOffSlashIcon : ViewIcon}
                                size={13}
                              />
                            </RowButton>
                            <Link
                              to={`/admin/media/${item.id}`}
                              aria-label={`Edit ${item.title}`}
                              title={`Edit ${item.title}`}
                              className="rounded-lg border border-border bg-surface-elevated p-2 text-text-secondary transition hover:text-text-primary"
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                            </Link>
                            {confirmingId === item.id ? (
                              <span className="flex flex-wrap items-center gap-2 rounded-lg border border-error/50 bg-error/10 py-1 pr-1 pl-3">
                                <span className="text-[10px] font-bold tracking-widest text-error uppercase">
                                  Delete permanently?
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Confirm delete ${item.title}`}
                                  disabled={busy}
                                  onClick={() => handleDelete(item)}
                                  className="rounded-md bg-error px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-text-primary uppercase transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Cancel delete ${item.title}`}
                                  disabled={busy}
                                  onClick={() => setConfirmingId('')}
                                  className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-text-secondary uppercase transition hover:text-text-primary"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <RowButton
                                label={`Delete ${item.title}`}
                                danger
                                disabled={busy}
                                onClick={() => setConfirmingId(item.id)}
                              >
                                <HugeiconsIcon icon={Delete01Icon} size={13} />
                              </RowButton>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <p className="text-[11px] tracking-widest text-text-muted uppercase">
        Hidden items stay here but leave the studio hub · delete is permanent
      </p>
    </div>
  )
}
