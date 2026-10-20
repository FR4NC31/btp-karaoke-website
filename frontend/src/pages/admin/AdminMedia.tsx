import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  adminMediaMove,
  adminMediaVisibility,
  deleteAdminMediaItem,
  fetchAdminMedia,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { MEDIA_SECTION_LABELS, type AdminMediaItem, type MediaSection } from '../../lib/media-api'
import AdminMediaCard from './components/AdminMediaCard'

/**
 * /admin/media — the media hub catalog behind /studio.
 *
 * Cards are grouped by section in hub order (video → music → radio) and take
 * the studio hub's card shape — cover artwork (striped default without one),
 * tag chip, title and artist — while keeping the console's full information:
 * the MP3/MP4 + cover + Live/Hidden chips, the section's meta line, and every
 * action. Play hands the row to the studio console for a staff preview —
 * offered exactly where users can play it: video rows (bundled-master
 * fallback included) and music rows with an upload; the console answers with
 * its staff-only Admin details panel. The other actions are POSTs to
 * /api/admin/media/*: hide/show pulls a row from the public feed without
 * deleting it, move swaps it with its neighbour, edit opens the full editor,
 * and delete is permanent — so it asks first (the delete icon turns into a
 * Confirm/Cancel pair; the row's uploaded file is deleted with it). The list
 * reloads after every action — the server owns the order, so the buttons'
 * edge states (first row can't move up, last can't move down) always follow
 * the reload.
 */

const SECTION_ORDER: MediaSection[] = ['video', 'music', 'radio']

export default function AdminMedia() {
  const [items, setItems] = useState<AdminMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  // Distinguishes a failed initial load from an action error: an action error
  // leaves the known catalog on screen, so its sections may legitimately be
  // empty. Only the initial failure makes "No items" a lie.
  const [loadFailed, setLoadFailed] = useState(false)
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
        setLoadFailed(false)
      } catch (err) {
        if (!alive) return
        setLoadError(describeBookingError(err, 'Could not load the media catalog.'))
        setLoadFailed(true)
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

  /**
   * Runs one row action, then reloads either way: a failed action may still
   * have changed server state (a 409 means another tab acted first), and a
   * successful one needs the server's order. The action's own error wins when
   * both the action and the reload fail.
   */
  async function runAction(item: AdminMediaItem, action: () => Promise<void>, fallback: string) {
    if (actingId) return
    setActingId(item.id)
    setConfirmingId('')
    setFlash('')
    setLoadError('')
    let failure = ''
    try {
      await action()
    } catch (err) {
      failure = describeBookingError(err, fallback)
    }
    try {
      await reload()
    } catch (err) {
      if (!failure) failure = describeBookingError(err, 'Could not refresh the catalog.')
    }
    if (failure) setLoadError(failure)
    setActingId('')
  }

  function handleVisibility(item: AdminMediaItem) {
    return runAction(
      item,
      async () => {
        const { item: updated } = await adminMediaVisibility(item.id, !item.isActive)
        setFlash(`${updated.title} is now ${updated.isActive ? 'live' : 'hidden'}.`)
      },
      'The item could not be updated.',
    )
  }

  function handleMove(item: AdminMediaItem, direction: 'up' | 'down') {
    return runAction(
      item,
      async () => {
        await adminMediaMove(item.id, direction)
        setFlash(`${item.title} moved ${direction}.`)
      },
      'The item could not be moved.',
    )
  }

  function handleDelete(item: AdminMediaItem) {
    return runAction(
      item,
      async () => {
        await deleteAdminMediaItem(item.id)
        setFlash(`${item.title} removed.`)
      },
      'The item could not be removed.',
    )
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
                  // A failed initial load already shows its alert; "none yet"
                  // would falsely claim the catalog is empty. Action errors do
                  // not suppress this because the catalog itself is known.
                  !loadFailed && (
                    <p className="text-sm text-text-muted">No items in this section yet.</p>
                  )
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sectionItems.map((item, index) => (
                      <AdminMediaCard
                        key={item.id}
                        item={item}
                        index={index}
                        count={sectionItems.length}
                        busy={actingId === item.id}
                        confirmingDelete={confirmingId === item.id}
                        onMove={handleMove}
                        onVisibility={handleVisibility}
                        onArmDelete={setConfirmingId}
                        onCancelDelete={() => setConfirmingId('')}
                        onDelete={handleDelete}
                      />
                    ))}
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
