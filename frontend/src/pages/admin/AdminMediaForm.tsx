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
 * song carries plays, a track tempo/key, a station freq/listeners) and the
 * shared boxes' labels (Artist / Description / Genre), while the payload
 * shape stays flat — exactly what /api/admin/media validates. An update
 * replaces the row, so clearing a box clears the column.
 *
 * Video songs and music tracks can also carry the real file: picking an
 * MP4/MP3 uploads it on save (POST /api/admin/media/upload, raw body) and the
 * console attaches the returned url to the row — replacing or removing a file
 * deletes the old upload. Picking a file reads its own metadata (music-metadata:
 * ID3 tags on MP3, atoms on MP4) and fills the blank boxes (title, artist,
 * album); the runtime is read straight off the picked file — video songs and
 * tracks alike — so there is no manual duration box. Nothing the admin
 * already typed gets clobbered (the runtime always refreshes: it describes
 * the picked file).
 *
 * Cover art / thumbnail: the file's embedded cover is applied automatically,
 * a video without one gets a real frame grabbed off it, and the admin can
 * always pick an image instead. Every cover is shrunk to display size
 * (browser-image-compression, WebP) before upload so the hub loads fast;
 * without any cover the hub shows the default art.
 */

const SECTION_ORDER: MediaSection[] = ['video', 'music', 'radio']

const SECTION_COPY: Record<
  MediaSection,
  {
    titleLabel: string
    titlePlaceholder: string
    /** Copy for the subtitle box — Description (music) / Genre (radio). */
    subtitleLabel?: string
    subtitlePlaceholder?: string
    tagPlaceholder: string
  }
> = {
  video: {
    titleLabel: 'Title',
    titlePlaceholder: 'Song title',
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

/** Seconds → "3:54" (or "1:02:03") — how the runtime line shows a file's length. */
function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Reads the runtime off a picked file (MP4 or MP3) with a throwaway element. */
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

/** A cover the picked file brought along — embedded art, or a grabbed frame. */
interface AutoCover {
  blob: Blob
  /** Where it came from: the file's tags, or a frame off the video. */
  origin: 'tags' | 'frame'
  /** Object URL for the preview; revoked as soon as the cover is replaced. */
  preview: string
  /** Filename the uploader sends with (X-File-Name, the display copy). */
  name: string
}

/** "song.mp4" → "song". */
function fileStem(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

/** Wraps a cover blob with its preview URL and upload filename. */
function makeAutoCover(blob: Blob, origin: AutoCover['origin'], sourceName: string): AutoCover {
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
  return {
    blob,
    origin,
    preview: URL.createObjectURL(blob),
    name: `${fileStem(sourceName)} - cover.${ext}`,
  }
}

/**
 * Reads a picked file's own metadata — ID3 tags on MP3, atoms on MP4 —
 * through music-metadata, loaded on demand so the parser only weighs on the
 * uploader. Any failure (or a tagless file) resolves to blanks.
 */
async function readFileTags(file: File): Promise<{
  title: string
  artist: string
  album: string
  cover: Blob | null
}> {
  try {
    const { parseBlob } = await import('music-metadata')
    const { common } = await parseBlob(file)
    const picture = common.picture?.[0]
    return {
      title: common.title?.trim() ?? '',
      artist: (common.artist ?? common.albumartist)?.trim() ?? '',
      album: common.album?.trim() ?? '',
      cover: picture ? new Blob([new Uint8Array(picture.data)], { type: picture.format }) : null,
    }
  } catch {
    return { title: '', artist: '', album: '', cover: null }
  }
}

/**
 * Grabs one frame (about a second in) off a picked video as a WebP blob —
 * the automatic thumbnail, so a video without embedded art still gets a real
 * preview instead of the striped placeholder.
 */
function grabVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const probe = document.createElement('video')
    probe.muted = true
    probe.playsInline = true
    probe.preload = 'metadata'

    const finish = (frame: Blob | null) => {
      URL.revokeObjectURL(url)
      resolve(frame)
    }

    probe.onloadedmetadata = () => {
      // Seek a moment in so the poster is not a black lead-in frame.
      probe.currentTime = Math.min(1, (probe.duration || 1) / 2)
    }
    probe.onseeked = () => {
      const scale = Math.min(1, 960 / probe.videoWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(probe.videoWidth * scale))
      canvas.height = Math.max(1, Math.round(probe.videoHeight * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        finish(null)
        return
      }
      ctx.drawImage(probe, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((frame) => finish(frame), 'image/webp', 0.85)
    }
    probe.onerror = () => finish(null)
    probe.src = url
  })
}

/**
 * Shrinks a cover to at most 1000px on its long edge and re-encodes it as
 * WebP (browser-image-compression, off the main thread), so the hub only
 * stores display-sized art and cards load fast. Any failure falls back to
 * the picked file — a big cover still beats no cover.
 */
async function optimizeCover(file: File): Promise<File> {
  try {
    const { default: imageCompression } = await import('browser-image-compression')
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1000,
      initialQuality: 0.82,
      useWebWorker: true,
      fileType: 'image/webp',
    })
    return new File([compressed], `${fileStem(file.name)}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
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
  const [artist, setArtist] = useState('')
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

  const [album, setAlbum] = useState('')
  // Lyrics live with the track: multi-line plain text, music rows only.
  const [lyrics, setLyrics] = useState('')
  // Covers split like the file: the stored upload is server truth, a picked
  // image overrides it, and `autoCover` is whatever the source file itself
  // carried (embedded art, or a frame grabbed off the video).
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverName, setCoverName] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverFilePreview, setCoverFilePreview] = useState<string | null>(null)
  const [autoCover, setAutoCoverState] = useState<AutoCover | null>(null)
  const [scanningFile, setScanningFile] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

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
        setArtist(item.artist ?? '')
        setTag(item.tag ?? '')
        setDuration(item.duration ?? '')
        setPlaysInput(item.plays === null ? '' : String(item.plays))
        setTempo(item.tempo ?? '')
        setSongKey(item.songKey ?? '')
        setFreq(item.freq ?? '')
        setListenersInput(item.listeners === null ? '' : String(item.listeners))
        setSourceUrl(item.sourceUrl)
        setSourceName(item.sourceName)
        setAlbum(item.album ?? '')
        setLyrics(item.lyrics ?? '')
        setCoverUrl(item.coverUrl)
        setCoverName(item.coverName)
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
    setArtist('')
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
    setAlbum('')
    setLyrics('')
    clearCoverSelection()
    setCoverUrl(null)
    setCoverName(null)
  }

  /** Drops the picked file (the stored one, if any, is untouched). */
  function clearFileSelection() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** Drops every *picked* cover (the stored one, if any, is untouched). */
  function clearCoverSelection() {
    setCoverFile(null)
    setCoverFilePreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setAutoCover(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  /** (Re)places the auto cover, revoking the previous preview URL. */
  function setAutoCover(next: AutoCover | null) {
    setAutoCoverState((current) => {
      if (current) URL.revokeObjectURL(current.preview)
      return next
    })
  }

  /** "Remove cover" — stored, picked and file-carried covers all drop. */
  function removeCover() {
    clearCoverSelection()
    setCoverUrl(null)
    setCoverName(null)
  }

  function removeStoredFile() {
    clearFileSelection()
    setSourceUrl(null)
    setSourceName(null)
    // The runtime described that file — a fresh pick reads the next one.
    setDuration('')
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    setFile(picked)
    setFieldError('')
    // A previous file's own cover does not belong to this one.
    setAutoCover(null)
    if (!picked) return

    setScanningFile(true)
    try {
      // Tag scan and runtime probe run together: the probe works for MP4 and
      // MP3 alike, so video songs and tracks both get their duration read
      // off the file.
      const [tags, seconds] = await Promise.all([readFileTags(picked), probeDuration(picked)])
      // Tags only fill blanks — copy the admin already typed always wins.
      if (tags.title) setTitle((current) => (current.trim() ? current : tags.title))
      if (tags.artist) setArtist((current) => (current.trim() ? current : tags.artist))
      if (tags.album) setAlbum((current) => (current.trim() ? current : tags.album))
      // The runtime always refreshes — it describes the file just picked.
      if (seconds !== null) setDuration(formatClock(seconds))

      if (tags.cover) {
        setAutoCover(makeAutoCover(tags.cover, 'tags', picked.name))
      } else if (section === 'video') {
        // No embedded art: a real frame beats the striped placeholder.
        const frame = await grabVideoFrame(picked)
        if (frame) setAutoCover(makeAutoCover(frame, 'frame', picked.name))
      }
    } finally {
      setScanningFile(false)
    }
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    if (!picked) return
    setFieldError('')
    setCoverFile(picked)
    setCoverFilePreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(picked)
    })
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

      // Cover priority: the picked image, else whatever the source file
      // carried (embedded art / grabbed frame). Both upload optimized; with
      // neither, the stored cover (or none) stays.
      let nextCoverUrl = coverUrl
      let nextCoverName = coverName
      const coverSource =
        coverFile ??
        (autoCover ? new File([autoCover.blob], autoCover.name, { type: autoCover.blob.type }) : null)
      if (coverSource) {
        const { file: stored } = await uploadAdminMediaFile(await optimizeCover(coverSource))
        nextCoverUrl = stored.url
        nextCoverName = stored.name
      }

      const input: AdminMediaInput = {
        section,
        title,
        subtitle,
        artist,
        tag,
        duration,
        plays,
        tempo,
        songKey,
        freq,
        listeners,
        sourceUrl: nextSourceUrl,
        sourceName: nextSourceName,
        album,
        lyrics,
        coverUrl: nextCoverUrl,
        coverName: nextCoverName,
      }

      const { item } = editing
        ? await updateAdminMediaItem(id!, input)
        : await createAdminMediaItem(input)
      setSaved(item)
      // Re-sync the file/cover blocks from the server's row and clear the
      // pickers.
      setSourceUrl(item.sourceUrl)
      setSourceName(item.sourceName)
      setCoverUrl(item.coverUrl)
      setCoverName(item.coverName)
      clearFileSelection()
      clearCoverSelection()
    } catch (err) {
      setFieldError(describeBookingError(err, 'The item could not be saved.'))
    } finally {
      setSubmitting(false)
    }
  }

  const copy = SECTION_COPY[section]
  // What the cover block previews: the fresh pick, the file's own cover, or
  // the stored one — null means the default art shows.
  const coverPreview = coverFilePreview ?? autoCover?.preview ?? coverUrl

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
                    // stale pick (and the cover it brought) so the wrong
                    // file type can never be attached.
                    clearFileSelection()
                    setAutoCover(null)
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
              {section === 'radio' ? (
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
              ) : (
                <div>
                  <label htmlFor="media-artist" className={LABEL_CLASSES}>
                    Artist
                  </label>
                  <input
                    id="media-artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Who performs it"
                    className={INPUT_CLASSES}
                  />
                </div>
              )}
            </div>

            {(section === 'video' || section === 'music') && (
              <div className="grid gap-4 sm:grid-cols-2">
                {section === 'music' && (
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
                )}
                <div>
                  <label htmlFor="media-album" className={LABEL_CLASSES}>
                    Album
                  </label>
                  <input
                    id="media-album"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="From the file's tags, or type one"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
            )}

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
                {scanningFile && (
                  <p role="status" className="mt-2 text-[11px] text-text-muted">
                    Reading the file's metadata…
                  </p>
                )}
                {!scanningFile && duration && (file || sourceUrl) && (
                  <p className="mt-2 text-[11px] text-text-muted">
                    Runtime: {duration} — read from the file.
                  </p>
                )}
              </div>
            )}

            {(section === 'video' || section === 'music') && (
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={LABEL_CLASSES}>
                    {section === 'video' ? 'Thumbnail' : 'Cover art'}
                  </span>
                  {(coverUrl || coverFile || autoCover) && (
                    <button
                      type="button"
                      onClick={removeCover}
                      className="text-[11px] font-bold tracking-widest text-text-secondary uppercase underline-offset-4 transition hover:text-error hover:underline"
                    >
                      Remove cover
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  Shown on the hub card, the console stage and the player bar. Images are
                  optimized (WebP, up to 1000px) before upload; without one the hub shows the
                  default art.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="size-16 shrink-0 rounded-md border border-border bg-surface-elevated object-cover"
                    />
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-md border border-dashed border-border text-[9px] font-bold tracking-widest text-text-muted uppercase">
                      Default
                    </span>
                  )}
                  <input
                    ref={coverInputRef}
                    id="media-cover"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/*"
                    onChange={handleCoverChange}
                    className="block w-full max-w-xs cursor-pointer text-xs text-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-primary file:transition hover:file:bg-primary-hover"
                  />
                </div>
                <label htmlFor="media-cover" className="sr-only">
                  {section === 'video'
                    ? 'Thumbnail image (JPG, PNG or WebP)'
                    : 'Cover image (JPG, PNG or WebP)'}
                </label>
                <p className="mt-2 text-[11px] text-text-muted">
                  {coverFile
                    ? `Chosen image: ${coverFile.name} — optimized and applied on save.`
                    : autoCover
                      ? autoCover.origin === 'tags'
                        ? "Found in the file's own tags — applied unless you pick your own."
                        : 'Grabbed from the video — applied unless you pick your own.'
                      : coverUrl
                        ? `Current cover: ${coverName ?? 'uploaded image'} — pick an image to replace it.`
                        : 'No cover yet — pick an image, or let the file supply one.'}
                </p>
              </div>
            )}

            {section === 'video' && (
              <div className="grid gap-4 sm:grid-cols-2">
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

            {section === 'music' && (
              <div>
                <label htmlFor="media-lyrics" className={LABEL_CLASSES}>
                  Lyrics
                </label>
                <textarea
                  id="media-lyrics"
                  rows={8}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Paste or type the track's lyrics — line breaks are kept."
                  className={`${INPUT_CLASSES} min-h-40 resize-y leading-relaxed`}
                />
                <p className="mt-1.5 text-[11px] text-text-muted">
                  Optional — saved with the track. Blank clears them.
                </p>
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
                  ? file || coverFile || autoCover
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
