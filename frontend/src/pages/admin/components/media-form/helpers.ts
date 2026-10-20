import type { MediaSection } from '../../../../lib/media-api'

/** The editor's picker order — video → music → radio, hub order. */
export const SECTION_ORDER: MediaSection[] = ['video', 'music', 'radio']

export interface SectionCopy {
  titleLabel: string
  titlePlaceholder: string
  /** Copy for the subtitle box — Description (music) / Genre (radio). */
  subtitleLabel?: string
  subtitlePlaceholder?: string
  tagPlaceholder: string
}

export const SECTION_COPY: Record<MediaSection, SectionCopy> = {
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

export const INPUT_CLASSES =
  'mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none'
export const LABEL_CLASSES = 'block text-[11px] font-bold tracking-widest text-text-secondary uppercase'

/** Blank box → null; anything else must be a whole, non-negative number. */
export function toCount(raw: string, label: string): number | null {
  const text = raw.trim()
  if (!text) return null
  const value = Number(text)
  // Match the API's Postgres `integer` ceiling, so a typo is caught before the
  // upload starts instead of surfacing as a server-side 400.
  if (!Number.isInteger(value) || value < 0 || value > 2_147_483_647) {
    throw new Error(`${label} must be a whole number between 0 and 2,147,483,647.`)
  }
  return value
}

/** Seconds → "3:54" (or "1:02:03") — how the runtime line shows a file's length. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Reads the runtime off a picked file (MP4 or MP3) with a throwaway element. */
export function probeDuration(file: File): Promise<number | null> {
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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** A cover the picked file brought along — embedded art, or a grabbed frame. */
export interface AutoCover {
  blob: Blob
  /** Where it came from: the file's tags, or a frame off the video. */
  origin: 'tags' | 'frame'
  /** Object URL for the preview; revoked as soon as the cover is replaced. */
  preview: string
  /** Filename the uploader sends with (X-File-Name, the display copy). */
  name: string
}

/** "song.mp4" → "song". */
export function fileStem(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

/** Wraps a cover blob with its preview URL and upload filename. */
export function makeAutoCover(blob: Blob, origin: AutoCover['origin'], sourceName: string): AutoCover {
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
export async function readFileTags(file: File): Promise<{
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
export function grabVideoFrame(file: File): Promise<Blob | null> {
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
export async function optimizeCover(file: File): Promise<File> {
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
