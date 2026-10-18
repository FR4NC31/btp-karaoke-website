import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  createAdminMediaItem,
  fetchAdminMedia,
  updateAdminMediaItem,
  uploadAdminMediaFile,
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
 *
 * Video songs and music tracks can also carry the real file: picking an
 * MP4/MP3 uploads it on save (POST /api/admin/media/upload, raw body) and the
 * console attaches the returned url to the row — replacing or removing a file
 * deletes the old upload. Picking a video auto-fills Duration from the file's
 * own metadata, so the card never has to guess.
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

/** Seconds → "3:54" (or "1:02:03"), the format the Duration box uses. */
function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Reads duration metadata from a picked file with a throwaway element. */
function probeDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const probe = document.createElement('video')
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      const value = probe.duration
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(value) ? value : null)
    }
    probe.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    probe.src = url
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  // The stored upload (server truth) and the freshly picked file (if any) are
  // separate: saving uploads the picked file first, then attaches its url.
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
        setSourceUrl(item.sourceUrl)
        setSourceName(item.sourceName)
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
    clearFileSelection()
    setSourceUrl(null)
    setSourceName(null)
  }

  /** Drops the picked file (the stored one, if any, is untouched). */
  function clearFileSelection() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeStoredFile() {
    clearFileSelection()
    setSourceUrl(null)
    setSourceName(null)
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    setFile(picked)
    setFieldError('')
    // Video rows read Duration off the file itself — no manual typing.
    if (picked && section === 'video') {
      const seconds = await probeDuration(picked)
      if (seconds !== null) setDuration(formatClock(seconds))
    }
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

    setSubmitting(true)
    try {
      let nextSourceUrl = sourceUrl
      let nextSourceName = sourceName
      if (file) {
        const { file: stored } = await uploadAdminMediaFile(file)
        nextSourceUrl = stored.url
        nextSourceName = stored.name
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
        sourceUrl: nextSourceUrl,
        sourceName: nextSourceName,
      }

      const { item } = editing
        ? await updateAdminMediaItem(id!, input)
        : await createAdminMediaItem(input)
      setSaved(item)
      // Re-sync the file block from the server's row and clear the picker.
      setSourceUrl(item.sourceUrl)
      setSourceName(item.sourceName)
      clearFileSelection()
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
                  onChange={(e) => {
                    setSection(e.target.value as MediaSection)
                    // The picker's accept changes with the section: drop a
                    // stale pick so the wrong file type can never be attached.
                    clearFileSelection()
                  }}
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

            {(section === 'video' || section === 'music') && (
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={LABEL_CLASSES}>Media file</span>
                  {sourceUrl && (
                    <span className="flex items-center gap-4 text-[11px] font-bold tracking-widest uppercase">
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-secondary underline-offset-4 transition hover:text-text-primary hover:underline"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={removeStoredFile}
                        className="text-text-secondary underline-offset-4 transition hover:text-error hover:underline"
                      >
                        Remove file
                      </button>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  {section === 'video'
                    ? 'Upload the karaoke MP4 — the console plays it straight from the hub. Without a file, the card falls back to the bundled local master.'
                    : 'Upload the MP3 — its hub card opens the console and really plays it. Without a file the card stays visual-only.'}
                </p>
                <input
                  ref={fileInputRef}
                  id="media-file"
                  type="file"
                  accept={section === 'video' ? '.mp4,video/mp4' : '.mp3,audio/mpeg'}
                  onChange={handleFileChange}
                  className="mt-2.5 block w-full cursor-pointer text-xs text-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-primary file:transition hover:file:bg-primary-hover"
                />
                <label htmlFor="media-file" className="sr-only">
                  {section === 'video' ? 'Video file (MP4)' : 'Audio file (MP3)'}
                </label>
                {file ? (
                  <p className="mt-2 text-[11px] font-semibold text-primary">
                    Ready to upload: {file.name} ({formatFileSize(file.size)})
                  </p>
                ) : sourceName ? (
                  <p className="mt-2 text-[11px] text-text-muted">
                    Current file: {sourceName} — pick a new one to replace it.
                  </p>
                ) : null}
              </div>
            )}

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
                {submitting
                  ? file
                    ? 'Uploading and saving…'
                    : 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Add to the hub'}
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
