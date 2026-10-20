import type { ChangeEvent, RefObject } from 'react'
import type { MediaSection } from '../../../../lib/media-api'
import { LABEL_CLASSES, formatFileSize } from './helpers'

type MediaFileFieldProps = {
  /** File sections only — radio rows carry no upload. */
  section: Extract<MediaSection, 'video' | 'music'>
  /** The stored upload (server truth) — preview + remove. */
  sourceUrl: string | null
  sourceName: string | null
  /** The freshly picked file, if any. */
  file: File | null
  scanningFile: boolean
  /** Runtime read off the picked/stored file ("3:54"). */
  duration: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveStored: () => void
}

/**
 * The MP4/MP3 upload box: stored-file preview/remove, the picker (accept
 * follows the section), and the picked file's name/size, scan and runtime
 * readouts.
 */
export default function MediaFileField({
  section,
  sourceUrl,
  sourceName,
  file,
  scanningFile,
  duration,
  fileInputRef,
  onChange,
  onRemoveStored,
}: MediaFileFieldProps) {
  return (
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
              onClick={onRemoveStored}
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
        onChange={onChange}
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
        <p className="mt-2 text-[11px] text-text-muted">Runtime: {duration} — read from the file.</p>
      )}
    </div>
  )
}
