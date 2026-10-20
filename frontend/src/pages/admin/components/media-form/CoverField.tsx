import type { ChangeEvent, RefObject } from 'react'
import type { MediaSection } from '../../../../lib/media-api'
import { LABEL_CLASSES, type AutoCover } from './helpers'

type CoverFieldProps = {
  section: Extract<MediaSection, 'video' | 'music'>
  coverUrl: string | null
  coverName: string | null
  coverFile: File | null
  /** Fresh pick → file-carried cover → stored cover (null = default art). */
  coverPreview: string | null
  /** The source file's own cover (embedded art or grabbed frame), if any. */
  autoCover: AutoCover | null
  coverInputRef: RefObject<HTMLInputElement | null>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

/**
 * Thumbnail / cover art box: current preview (or the default-art tile),
 * remove action, picker and the line explaining what will be applied on
 * save (picked image, the file's own art, the stored cover, or nothing).
 */
export default function CoverField({
  section,
  coverUrl,
  coverName,
  coverFile,
  coverPreview,
  autoCover,
  coverInputRef,
  onChange,
  onRemove,
}: CoverFieldProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={LABEL_CLASSES}>{section === 'video' ? 'Thumbnail' : 'Cover art'}</span>
        {(coverUrl || coverFile || autoCover) && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] font-bold tracking-widest text-text-secondary uppercase underline-offset-4 transition hover:text-error hover:underline"
          >
            Remove cover
          </button>
        )}
      </div>
      <p className="mt-1 text-[11px] text-text-muted">
        Shown on the hub card, the console stage and the player bar. Images are optimized (WebP, up
        to 1000px) before upload; without one the hub shows the default art.
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
          onChange={onChange}
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
  )
}
