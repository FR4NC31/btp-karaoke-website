import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { type AdminMediaItem } from '../../../lib/media-api'
import {
  SECTION_COVER_GRADIENT,
  SECTION_ICONS,
  canPreview,
  metaParts,
} from './media-meta'
import MediaItemActions from './MediaItemActions'

function Badge({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${className}`}
    >
      {children}
    </span>
  )
}

type AdminMediaCardProps = {
  item: AdminMediaItem
  busy: boolean
  confirmingDelete: boolean
  onVisibility: (item: AdminMediaItem) => void
  onArmDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (item: AdminMediaItem) => void
}

/**
 * Grid layout card for the admin media hub: cover with badges and the big
 * centre play button, then title, meta and the action cluster. The whole
 * cover is the `Play {title}` link so there is never a second control with
 * the same accessible name.
 */
export default function AdminMediaCard({
  item,
  busy,
  confirmingDelete,
  onVisibility,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: AdminMediaCardProps) {
  const SectionIcon = SECTION_ICONS[item.section]
  // The cover badge already carries the duration — one place only.
  const parts = metaParts(item).filter((part) => part !== item.duration)
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)
  const showCover = item.coverUrl !== null && item.coverUrl !== failedCoverUrl
  const previewable = canPreview(item)

  return (
    <li
      className={`group flex flex-col overflow-hidden rounded-xl border bg-surface transition ${
        item.isActive
          ? 'border-border hover:border-primary/40'
          : 'border-warning/40 bg-warning/5'
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {showCover ? (
          <img
            src={item.coverUrl!}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedCoverUrl(item.coverUrl)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center text-text-muted ${SECTION_COVER_GRADIENT[item.section]}`}
          >
            <HugeiconsIcon icon={SectionIcon} size={24} />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 flex flex-wrap items-center gap-1">
          {item.tag && <Badge className="border-primary/40 bg-primary-soft text-primary">{item.tag}</Badge>}
          <Badge
            className={
              item.isActive
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-surface-elevated text-text-muted'
            }
          >
            {item.isActive ? 'Live' : 'Hidden'}
          </Badge>
        </div>

        {item.duration && (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-text-primary">
            {item.duration}
          </span>
        )}

        {previewable && (
          <Link
            to="/studio/player-queue"
            state={{ autoplay: true, item }}
            aria-label={`Play ${item.title}`}
            title={`Play ${item.title}`}
            className="absolute inset-0 grid place-items-center outline-primary/60 transition hover:bg-black/20 focus-visible:bg-black/20 focus-visible:outline-2 -outline-offset-2"
          >
            <span className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/55 text-text-primary backdrop-blur-sm transition group-hover:scale-105">
              <HugeiconsIcon icon={PlayIcon} size={15} />
            </span>
          </Link>
        )}
      </div>

      <div className="px-2.5 pt-2 pb-1.5">
        <p className="line-clamp-1 font-heading text-xs leading-tight font-bold tracking-wide uppercase">
          {item.title}
        </p>
        {(item.artist ?? item.subtitle) && (
          <p className="mt-0.5 truncate text-[10px] text-text-muted">
            {item.artist ?? item.subtitle}
          </p>
        )}
        {(item.sourceUrl || item.coverUrl) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {item.sourceUrl && (
              <Badge
                className="border-primary/40 bg-primary-soft text-primary"
              >
                {item.sourceUrl.endsWith('.mp3') ? 'MP3 file' : 'MP4 file'}
              </Badge>
            )}
            {item.coverUrl && (
              <Badge className="border-primary/40 bg-primary-soft text-primary">Cover</Badge>
            )}
          </div>
        )}
        {parts.length > 0 && (
          <p className="mt-1.5 text-[9px] tracking-widest text-text-muted uppercase">
            {parts.join(' · ')}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border px-2 py-1.5">
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
