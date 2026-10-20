import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  createAdminMediaItem,
  discardAdminMediaUpload,
  fetchAdminMedia,
  updateAdminMediaItem,
  uploadAdminMediaFile,
  type AdminMediaInput,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { MEDIA_SECTION_LABELS, type AdminMediaItem, type MediaSection } from '../../lib/media-api'
import CoverField from './components/media-form/CoverField'
import MediaBasics from './components/media-form/MediaBasics'
import MediaFileField from './components/media-form/MediaFileField'
import { LyricsField, MusicFields, RadioFields, VideoFields } from './components/media-form/SectionFields'
import {
  formatClock,
  grabVideoFrame,
  makeAutoCover,
  optimizeCover,
  probeDuration,
  readFileTags,
  toCount,
  type AutoCover,
} from './components/media-form/helpers'

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
 *
 * The presentational blocks live in components/media-form: shared basics,
 * the file/cover boxes, the section-specific fields, and the pure media
 * helpers (tag scan, runtime probe, frame grab, compression). This page owns
 * the form state and the save pipeline.
 */

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
  // Bumped on every pick (and whenever a pick is dropped), so a scan that
  // finishes after its file was replaced can be discarded instead of
  // overwriting the form with the old file's metadata.
  const scanGeneration = useRef(0)
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
    // Any scan in flight belongs to the file being dropped.
    scanGeneration.current += 1
    setScanningFile(false)
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
    // The automatic cover came from the file being detached, so it goes too —
    // otherwise saving would upload a cover for a file the admin removed.
    setAutoCover(null)
    // The runtime described that file — a fresh pick reads the next one.
    setDuration('')
  }

  /**
   * True when the stored upload (if any) fits what `target` accepts: radio
   * rows carry no file, video rows an MP4, music rows an MP3.
   */
  function sectionAcceptsStoredFile(target: MediaSection): boolean {
    if (!sourceUrl) return true
    if (target === 'radio') return false
    const isMp3 = sourceUrl.toLowerCase().endsWith('.mp3')
    return target === 'music' ? isMp3 : !isMp3
  }

  /** Section switch: stale picks cannot follow the row into another type. */
  function handleSectionChange(next: MediaSection) {
    setSection(next)
    // The picker's accept changes with the section: drop a stale pick (and
    // the cover it brought) so the wrong file type can never be attached.
    clearFileSelection()
    setAutoCover(null)
    // A stored upload the new section cannot carry (radio carries none; video
    // and music each carry their own format) is detached rather than
    // submitted against the wrong section.
    if (!sectionAcceptsStoredFile(next)) removeStoredFile()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    // Each pick (or drop) invalidates any scan still running: its metadata
    // describes a file that is no longer the selection.
    const generation = ++scanGeneration.current
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
      // A superseded scan must not touch the form.
      if (scanGeneration.current !== generation) return
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
        if (frame && scanGeneration.current === generation) {
          setAutoCover(makeAutoCover(frame, 'frame', picked.name))
        }
      }
    } finally {
      // Only the newest scan owns the spinner.
      if (scanGeneration.current === generation) setScanningFile(false)
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
    // Saving mid-scan would create a row without the file's runtime, tags or
    // automatic cover — wait for the scan to settle.
    if (submitting || scanningFile) return
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
    // Everything this attempt uploads; discarded again if a later step fails
    // so a failed save cannot leak the bytes.
    const freshUploads: string[] = []
    try {
      let nextSourceUrl = sourceUrl
      let nextSourceName = sourceName
      if (file) {
        const { file: stored } = await uploadAdminMediaFile(file)
        nextSourceUrl = stored.url
        nextSourceName = stored.name
        freshUploads.push(stored.url)
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
        freshUploads.push(stored.url)
      }

      // Only the selected section's fields are submitted: the others go
      // empty, so a section change can never carry hidden data (an old source
      // file, a stale cover, a leftover tempo) into the row.
      const fileSections = section === 'video' || section === 'music'
      const input: AdminMediaInput = {
        section,
        title,
        subtitle,
        artist: section === 'radio' ? '' : artist,
        tag,
        duration: fileSections ? duration : '',
        plays: section === 'video' ? plays : null,
        tempo: section === 'music' ? tempo : '',
        songKey: section === 'music' ? songKey : '',
        freq: section === 'radio' ? freq : '',
        listeners: section === 'radio' ? listeners : null,
        sourceUrl: fileSections ? nextSourceUrl : null,
        sourceName: fileSections ? nextSourceName : null,
        album: fileSections ? album : '',
        lyrics: section === 'music' ? lyrics : '',
        coverUrl: fileSections ? nextCoverUrl : null,
        coverName: fileSections ? nextCoverName : null,
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
      // The row was never written, so nothing references these uploads.
      for (const url of freshUploads) {
        await discardAdminMediaUpload(url)
      }
    } finally {
      setSubmitting(false)
    }
  }

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
            <MediaBasics
              section={section}
              onSectionChange={handleSectionChange}
              tag={tag}
              onTagChange={setTag}
              title={title}
              onTitleChange={setTitle}
              subtitle={subtitle}
              onSubtitleChange={setSubtitle}
              artist={artist}
              onArtistChange={setArtist}
              album={album}
              onAlbumChange={setAlbum}
            />

            {(section === 'video' || section === 'music') && (
              <MediaFileField
                section={section}
                sourceUrl={sourceUrl}
                sourceName={sourceName}
                file={file}
                scanningFile={scanningFile}
                duration={duration}
                fileInputRef={fileInputRef}
                onChange={handleFileChange}
                onRemoveStored={removeStoredFile}
              />
            )}

            {(section === 'video' || section === 'music') && (
              <CoverField
                section={section}
                coverUrl={coverUrl}
                coverName={coverName}
                coverFile={coverFile}
                coverPreview={coverPreview}
                autoCover={autoCover}
                coverInputRef={coverInputRef}
                onChange={handleCoverChange}
                onRemove={removeCover}
              />
            )}

            {section === 'video' && <VideoFields value={playsInput} onChange={setPlaysInput} />}

            {section === 'music' && (
              <>
                <MusicFields
                  tempo={tempo}
                  onTempoChange={setTempo}
                  songKey={songKey}
                  onSongKeyChange={setSongKey}
                />
                <LyricsField value={lyrics} onChange={setLyrics} />
              </>
            )}

            {section === 'radio' && (
              <RadioFields
                freq={freq}
                onFreqChange={setFreq}
                listeners={listenersInput}
                onListenersChange={setListenersInput}
              />
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={submitting || scanningFile}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? file || coverFile || autoCover
                    ? 'Uploading and saving…'
                    : 'Saving…'
                  : scanningFile
                    ? 'Reading the file…'
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
