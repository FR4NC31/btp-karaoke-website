import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  adminMediaVisibility,
  deleteAdminMediaItem,
  fetchAdminMedia,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import type { AdminMediaItem, MediaSection } from '../../lib/media-api'
import type { MediaHubView } from '../../lib/admin-media-view'
import AdminMediaCard from './components/AdminMediaCard'
import AdminMediaRow from './components/AdminMediaRow'
import { SECTION_ICONS, sectionCountLabel } from './components/media-meta'

const SECTION_ORDER: MediaSection[] = ['video', 'music', 'radio']

const SECTION_TITLES: Record<MediaSection, string> = {
  video: 'Video Songs',
  music: 'Music Tracks',
  radio: 'Radio Stations',
}

type SectionTab = 'all' | MediaSection

const TABS: Array<{ id: SectionTab; label: string }> = [
  { id: 'all', label: 'All items' },
  { id: 'video', label: 'Video songs' },
  { id: 'music', label: 'Music tracks' },
  { id: 'radio', label: 'Radio stations' },
]

type MediaHubContext = {
  mediaView: MediaHubView
  setMediaView: (view: MediaHubView) => void
}

export default function AdminMedia() {
  const { mediaView } = useOutletContext<MediaHubContext>()
  const [items, setItems] = useState<AdminMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  // Distinguishes a failed initial load from an action error: an action error
  // leaves the known catalog on screen, so its sections may legitimately be
  // empty. Only the initial failure makes "No items" a lie.
  const [loadFailed, setLoadFailed] = useState(false)
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')
  const [confirmingId, setConfirmingId] = useState('')
  const [tab, setTab] = useState<SectionTab>('all')
  const [query, setQuery] = useState('')

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

  const trimmedQuery = query.trim().toLowerCase()

  // Tab picks the sections, the search box narrows within them by title,
  // artist, description or tag.
  const visibleSections = useMemo(() => {
    return SECTION_ORDER.filter((section) => tab === 'all' || tab === section).map((section) => {
      const sectionItems = items.filter(
        (item) =>
          item.section === section &&
          (trimmedQuery === '' ||
            [item.title, item.artist, item.subtitle, item.tag]
              .filter((value): value is string => value !== null)
              .some((value) => value.toLowerCase().includes(trimmedQuery))),
      )
      return { section, items: sectionItems }
    })
  }, [items, tab, trimmedQuery])

  const visibleCount = visibleSections.reduce((total, entry) => total + entry.items.length, 0)

  return (
    <div className="space-y-6">
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

      {/* Filter bar: section tabs on the left, catalog search on the right. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-2">
        <div role="group" aria-label="Filter by section" className="flex flex-wrap items-center gap-1.5">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={tab === entry.id}
              onClick={() => setTab(entry.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition ${
                tab === entry.id
                  ? 'bg-primary text-text-primary'
                  : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Filter media tracks</span>
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter media tracks..."
            className="h-9 w-full rounded-lg border border-border bg-surface-elevated pr-3 pl-8 text-xs text-text-primary placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
          />
        </label>
      </div>

      {loading ? (
        <p role="status" className="text-sm text-text-muted">
          Loading the catalog…
        </p>
      ) : (
        <div className="space-y-8">
          {visibleSections.map(({ section, items: sectionItems }) => {
            const SectionIcon = SECTION_ICONS[section]
            return (
              <section key={section}>
                <div className="mb-3 flex items-center gap-2.5">
                  <HugeiconsIcon icon={SectionIcon} size={15} className="text-primary" />
                  <h2 className="font-heading text-base font-bold tracking-widest uppercase">
                    {SECTION_TITLES[section]}
                  </h2>
                  <span className="ml-auto rounded border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                    {sectionCountLabel(section, sectionItems.length)}
                  </span>
                </div>

                {sectionItems.length > 0 ? (
                  <ul
                    key={mediaView}
                    className={`animate-in fade-in-0 fill-mode-both duration-200 ${
                      mediaView === 'grid'
                        ? 'grid gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
                        : 'space-y-2'
                    }`}
                  >
                    {sectionItems.map((item) =>
                      mediaView === 'grid' ? (
                        <AdminMediaCard
                          key={item.id}
                          item={item}
                          busy={actingId === item.id}
                          confirmingDelete={confirmingId === item.id}
                          onVisibility={handleVisibility}
                          onArmDelete={setConfirmingId}
                          onCancelDelete={() => setConfirmingId('')}
                          onDelete={handleDelete}
                        />
                      ) : (
                        <AdminMediaRow
                          key={item.id}
                          item={item}
                          busy={actingId === item.id}
                          confirmingDelete={confirmingId === item.id}
                          onVisibility={handleVisibility}
                          onArmDelete={setConfirmingId}
                          onCancelDelete={() => setConfirmingId('')}
                          onDelete={handleDelete}
                        />
                      ),
                    )}
                  </ul>
                ) : (
                  !loadFailed &&
                  tab === 'all' && (
                    <p className="text-sm text-text-muted">No items in this section yet.</p>
                  )
                )}
              </section>
            )
          })}

          {!loading && visibleCount === 0 && trimmedQuery !== '' && (
            <p className="text-sm text-text-muted">
              No items match “{query.trim()}”. Try a different title, artist or tag.
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] tracking-widest text-text-muted uppercase">
        Hidden items stay here but leave the studio hub · delete is permanent
      </p>
    </div>
  )
}
