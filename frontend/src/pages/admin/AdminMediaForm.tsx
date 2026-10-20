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
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [album, setAlbum] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverName, setCoverName] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverFilePreview, setCoverFilePreview] = useState<string | null>(null)
  const [autoCover, setAutoCoverState] = useState<AutoCover | null>(null)
  const [scanningFile, setScanningFile] = useState(false)
  const scanGeneration = useRef(0)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

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

  useEffect(() => {
    return () => {
      if (autoCover) URL.revokeObjectURL(autoCover.preview)
    }
  }, [autoCover])

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

  function clearFileSelection() {
    scanGeneration.current += 1
    setScanningFile(false)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function clearCoverSelection() {
    setCoverFile(null)
    setCoverFilePreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setAutoCover(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  function setAutoCover(next: AutoCover | null) {
    setAutoCoverState((current) => {
      if (current) URL.revokeObjectURL(current.preview)
      return next
    })
  }

  function removeCover() {
    clearCoverSelection()
    setCoverUrl(null)
    setCoverName(null)
  }

  function removeStoredFile() {
    clearFileSelection()
    setSourceUrl(null)
    setSourceName(null)
    setAutoCover(null)
    setDuration('')
  }

  function sectionAcceptsStoredFile(target: MediaSection): boolean {
    if (!sourceUrl) return true
    if (target === 'radio') return false
    const isMp3 = sourceUrl.toLowerCase().endsWith('.mp3')
    return target === 'music' ? isMp3 : !isMp3
  }

  function handleSectionChange(next: MediaSection) {
    setSection(next)
    clearFileSelection()
    setAutoCover(null)
    if (next === 'radio') clearCoverSelection()
    if (!sectionAcceptsStoredFile(next)) removeStoredFile()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    const generation = ++scanGeneration.current
    setFile(picked)
    setFieldError('')
    setAutoCover(null)
    if (!picked) return

    setScanningFile(true)
    try {
      const [tags, seconds] = await Promise.all([readFileTags(picked), probeDuration(picked)])
      if (scanGeneration.current !== generation) return
      if (tags.title) setTitle((current) => (current.trim() ? current : tags.title))
      if (tags.artist) setArtist((current) => (current.trim() ? current : tags.artist))
      if (tags.album) setAlbum((current) => (current.trim() ? current : tags.album))
      setDuration(seconds === null ? '' : formatClock(seconds))

      if (tags.cover) {
        setAutoCover(makeAutoCover(tags.cover, 'tags', picked.name))
      } else if (section === 'video') {
        const frame = await grabVideoFrame(picked)
        if (frame && scanGeneration.current === generation) {
          setAutoCover(makeAutoCover(frame, 'frame', picked.name))
        }
      }
    } finally {
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
    const fileSections = section === 'video' || section === 'music'
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

      let nextCoverUrl = coverUrl
      let nextCoverName = coverName
      const coverSource = fileSections
        ? coverFile ??
          (autoCover ? new File([autoCover.blob], autoCover.name, { type: autoCover.blob.type }) : null)
        : null
      if (coverSource) {
        const { file: stored } = await uploadAdminMediaFile(await optimizeCover(coverSource))
        nextCoverUrl = stored.url
        nextCoverName = stored.name
        freshUploads.push(stored.url)
      }

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
      setSourceUrl(item.sourceUrl)
      setSourceName(item.sourceName)
      setCoverUrl(item.coverUrl)
      setCoverName(item.coverName)
      clearFileSelection()
      clearCoverSelection()
    } catch (err) {
      setFieldError(describeBookingError(err, 'The item could not be saved.'))
      for (const url of freshUploads) {
        await discardAdminMediaUpload(url)
      }
    } finally {
      setSubmitting(false)
    }
  }

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
