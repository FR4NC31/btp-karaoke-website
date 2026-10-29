import { useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import type { AdminMediaItem } from '../../../lib/media-api'
import { SECTION_ICONS, canPreview, metaParts } from './media-meta'
import MediaItemActions, { PreviewSpacerIcon } from './MediaItemActions'

function Badge({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${className}`}
    >
      {children}
    </span>
  )
}

type AdminMediaRowProps = {
  item: AdminMediaItem
  busy: boolean
  confirmingDelete: boolean
  onVisibility: (item: AdminMediaItem) => void
  onArmDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (item: AdminMediaItem) => void
}

/**
 * List layout row for the admin media hub: cover thumbnail when the item has
 * one — a play link with hover icon when the item is playable, a plain image
 * otherwise — else the square play button or a section-icon spacer; then
 * title/meta stack, badges, and the same action cluster as the grid card.
 * Still an `<li>` so the E2E `main li` pins hold in both views.
 */
export default function AdminMediaRow({
  item,
  busy,
  confirmingDelete,
  onVisibility,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: AdminMediaRowProps) {
  const SectionIcon = SECTION_ICONS[item.section]
  const parts = metaParts(item)
  const previewable = canPreview(item)
  // Same failed-cover guard as the grid card: a broken URL falls back to the
  // plain play button instead of a dead <img>.
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)
  const showThumb = item.coverUrl !== null && item.coverUrl !== failedCoverUrl
  const thumbImg = (
    <img
      src={item.coverUrl!}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedCoverUrl(item.coverUrl)}
      className="h-full w-full object-cover"
    />
  )

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
        item.isActive
          ? 'border-border bg-surface hover:border-primary/40'
          : 'border-warning/40 bg-warning/5'
      }`}
    >
      {showThumb ? (
        previewable ? (
          <Link
            to="/studio/player-queue"
            state={{ autoplay: true, item }}
            aria-label={`Play ${item.title}`}
            title={`Play ${item.title}`}
            className="group/thumb relative size-9 shrink-0 overflow-hidden rounded-lg border border-border"
          >
            {thumbImg}
            <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover/thumb:bg-black/45">
              <HugeiconsIcon
                icon={PlayIcon}
                size={12}
                className="text-text-primary opacity-0 transition group-hover/thumb:opacity-100"
              />
            </span>
          </Link>
        ) : (
          <span className="relative block size-9 shrink-0 overflow-hidden rounded-lg border border-border">
            {thumbImg}
          </span>
        )
      ) : previewable ? (
        <Link
          to="/studio/player-queue"
          state={{ autoplay: true, item }}
          aria-label={`Play ${item.title}`}
          title={`Play ${item.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary-soft/40 text-primary transition hover:border-primary hover:bg-primary-soft"
        >
          <HugeiconsIcon icon={PlayIcon} size={14} />
        </Link>
      ) : (
        <PreviewSpacerIcon icon={SectionIcon} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="font-heading text-sm leading-tight font-bold tracking-wide uppercase">
            {item.title}
          </p>
          {item.tag && (
            <Badge className="border-primary/40 bg-primary-soft text-primary">{item.tag}</Badge>
          )}
          <Badge
            className={
              item.isActive
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-surface-elevated text-text-muted'
            }
          >
            {item.isActive ? 'Live' : 'Hidden'}
          </Badge>
          {(item.sourceUrl || item.coverUrl) && (
            <>
              {item.sourceUrl && (
                <Badge className="border-primary/40 bg-primary-soft text-primary">
                  {item.sourceUrl.endsWith('.mp3') ? 'MP3 file' : 'MP4 file'}
                </Badge>
              )}
              {item.coverUrl && (
                <Badge className="border-primary/40 bg-primary-soft text-primary">Cover</Badge>
              )}
            </>
          )}
        </div>
        <p className="mt-1 truncate text-[11px] text-text-muted">
          {[item.artist ?? item.subtitle, ...parts].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <MediaItemActions
          item={item}
          busy={busy}
          confirmingDelete={confirmingDelete}
          onVisibility={onVisibility}
          onArmDelete={onArmDelete}
          onCancelDelete={onCancelDelete}
          onDelete={onDelete}
        />
      </div>
    </li>
  )
}
