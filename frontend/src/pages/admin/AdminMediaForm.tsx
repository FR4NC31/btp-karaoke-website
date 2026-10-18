import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  createAdminMediaItem,
  fetchAdminMedia,
  updateAdminMediaItem,
  type AdminMediaInput,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { MEDIA_SECTION_LABELS, type AdminMediaItem, type MediaSection } from '../../lib/media-api'

/**
 * /admin/media/new and /admin/media/:id — the catalog editor.
 *
 * One form for both: the section picker swaps the visible fields (a video
 * song carries duration/plays, a track tempo/key, a station freq/listeners)
 * and the title/subtitle labels, while the payload shape stays flat — exactly
 * what /api/admin/media validates. An update replaces the row, so clearing a
 * box clears the column.
 */

const SECTION_ORDER: MediaSection[] = ['video', 'music', 'radio']

const SECTION_COPY: Record<
  MediaSection,
  {
    titleLabel: string
    titlePlaceholder: string
    subtitleLabel: string
    subtitlePlaceholder: string
    tagPlaceholder: string
  }
> = {
  video: {
    titleLabel: 'Title',
    titlePlaceholder: 'Song title',
    subtitleLabel: 'Artist',
    subtitlePlaceholder: 'Who performs it',
    tagPlaceholder: 'KTV',
  },
  music: {
    titleLabel: 'Title',
    titlePlaceholder: 'Set or track name',
    subtitleLabel: 'Description',
    subtitlePlaceholder: 'Engineer, archive or origin',
    tagPlaceholder: 'MIX',
  },
  radio: {
    titleLabel: 'Station name',
    titlePlaceholder: 'Station name',
    subtitleLabel: 'Genre',
    subtitlePlaceholder: 'OPM & Lounge',
    tagPlaceholder: 'On Air',
  },
}

const INPUT_CLASSES =
  'mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none'
const LABEL_CLASSES = 'block text-[11px] font-bold tracking-widest text-text-secondary uppercase'

/** Blank box → null; anything else must be a whole, non-negative number. */
function toCount(raw: string, label: string): number | null {
  const text = raw.trim()
  if (!text) return null
  const value = Number(text)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a whole, non-negative number.`)
  }
  return value
}

export default function AdminMediaForm() {
  const { id } = useParams()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [saved, setSaved] = useState<AdminMediaItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [section, setSection] = useState<MediaSection>('video')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [tag, setTag] = useState('')
  const [duration, setDuration] = useState('')
  const [playsInput, setPlaysInput] = useState('')
  const [tempo, setTempo] = useState('')
  const [songKey, setSongKey] = useState('')
  const [freq, setFreq] = useState('')
  const [listenersInput, setListenersInput] = useState('')

  // Edit mode: load the row and prefill. All state lands in the async
  // callback, so nothing here runs synchronously inside the effect body.
  useEffect(() => {
    if (!id) return
    let alive = true

    async function load() {
      setLoading(true)
      try {
        const { items } = await fetchAdminMedia()
        if (!alive) return
        const item = items.find((candidate) => candidate.id === id)
        if (!item) {
          setLoadError('That media item does not exist — it may have been deleted.')
          return
        }
        setSection(item.section)
        setTitle(item.title)
        setSubtitle(item.subtitle ?? '')
        setTag(item.tag ?? '')
        setDuration(item.duration ?? '')
        setPlaysInput(item.plays === null ? '' : String(item.plays))
        setTempo(item.tempo ?? '')
        setSongKey(item.songKey ?? '')
        setFreq(item.freq ?? '')
        setListenersInput(item.listeners === null ? '' : String(item.listeners))
        setLoadError('')
      } catch (err) {
        if (!alive) return
        setLoadError(describeBookingError(err, 'Could not load the media item.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [id])

  function clearForAnother() {
    setSaved(null)
    setTitle('')
    setSubtitle('')
    setTag('')
    setDuration('')
    setPlaysInput('')
    setTempo('')
    setSongKey('')
    setFreq('')
    setListenersInput('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setFieldError('')
    setSaved(null)

    let plays: number | null
    let listeners: number | null
    try {
      plays = toCount(playsInput, 'Plays')
      listeners = toCount(listenersInput, 'Listeners')
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : 'Check the numbers and try again.')
      return
    }

    const input: AdminMediaInput = {
      section,
      title,
      subtitle,
      tag,
      duration,
      plays,
      tempo,
      songKey,
      freq,
      listeners,
    }

    setSubmitting(true)
    try {
      const { item } = editing
        ? await updateAdminMediaItem(id!, input)
        : await createAdminMediaItem(input)
      setSaved(item)
    } catch (err) {
      setFieldError(describeBookingError(err, 'The item could not be saved.'))
    } finally {
      setSubmitting(false)
    }
  }

  const copy = SECTION_COPY[section]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">
            {editing ? 'Edit catalog item' : 'New catalog item'}
          </h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">
            {editing ? 'Changes go live on the hub immediately' : 'Publish to the studio hub'}
          </p>
        </div>
        <Link
          to="/admin/media"
          className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:text-text-primary"
        >
          Back to Media Hub
        </Link>
      </header>

      {loadError && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </p>
      )}

      {saved && (
        <div
          role="status"
          className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <p className="flex items-start gap-2.5">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
            {editing
              ? `Saved “${saved.title}”.`
              : `Added “${saved.title}” to the ${MEDIA_SECTION_LABELS[saved.section].toLowerCase()}s — it is live on the hub.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 pl-6.5">
            <Link
              to="/admin/media"
              className="font-bold tracking-widest uppercase underline-offset-4 hover:underline"
            >
              Back to the Media Hub
            </Link>
            {editing ? (
              <Link
                to="/studio"
                className="font-bold tracking-widest uppercase underline-offset-4 hover:underline"
              >
                Open the studio hub
              </Link>
            ) : (
              <button
                type="button"
                onClick={clearForAnother}
                className="font-bold tracking-widest uppercase underline-offset-4 hover:underline"
              >
                Add another
              </button>
            )}
          </div>
        </div>
      )}

      {fieldError && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {fieldError}
        </p>
      )}

      {loading ? (
        <p role="status" className="text-sm text-text-muted">
          Loading the item…
        </p>
      ) : (
        !loadError && (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-surface p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="media-section" className={LABEL_CLASSES}>
                  Type
                </label>
                <select
                  id="media-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value as MediaSection)}
                  className={INPUT_CLASSES}
                >
                  {SECTION_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {MEDIA_SECTION_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="media-tag" className={LABEL_CLASSES}>
                  Tag chip
                </label>
                <input
                  id="media-tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder={copy.tagPlaceholder}
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="media-title" className={LABEL_CLASSES}>
                  {copy.titleLabel}
                </label>
                <input
                  id="media-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={copy.titlePlaceholder}
                  className={INPUT_CLASSES}
                />
              </div>
              <div>
                <label htmlFor="media-subtitle" className={LABEL_CLASSES}>
                  {copy.subtitleLabel}
                </label>
                <input
                  id="media-subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder={copy.subtitlePlaceholder}
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            {section === 'video' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="media-duration" className={LABEL_CLASSES}>
                    Duration
                  </label>
                  <input
                    id="media-duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="3:54"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label htmlFor="media-plays" className={LABEL_CLASSES}>
                    Plays
                  </label>
                  <input
                    id="media-plays"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={playsInput}
                    onChange={(e) => setPlaysInput(e.target.value)}
                    placeholder="0"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
            )}

            {section === 'music' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="media-tempo" className={LABEL_CLASSES}>
                    Tempo
                  </label>
                  <input
                    id="media-tempo"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    placeholder="118 BPM"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label htmlFor="media-songkey" className={LABEL_CLASSES}>
                    Key
                  </label>
                  <input
                    id="media-songkey"
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    placeholder="Fmaj"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
            )}

            {section === 'radio' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="media-freq" className={LABEL_CLASSES}>
                    Frequency
                  </label>
                  <input
                    id="media-freq"
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                    placeholder="FM 91.5"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label htmlFor="media-listeners" className={LABEL_CLASSES}>
                    Listeners
                  </label>
                  <input
                    id="media-listeners"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={listenersInput}
                    onChange={(e) => setListenersInput(e.target.value)}
                    placeholder="0"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add to the hub'}
              </button>
              <Link
                to="/admin/media"
                className="text-xs font-bold tracking-widest text-text-secondary uppercase underline-offset-4 transition hover:text-text-primary hover:underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        )
      )}
    </div>
  )
}
