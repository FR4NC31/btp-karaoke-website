import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete01Icon,
  MusicNote01Icon,
  PencilEdit01Icon,
  PlayIcon,
  Radio01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { formatCount, type AdminMediaItem, type MediaSection } from '../../../lib/media-api'

const STATUS_STYLES: Record<'live' | 'hidden', string> = {
  live: 'border-success/40 bg-success/10 text-success',
  hidden: 'border-border bg-surface-elevated text-text-muted',
}

const SECTION_ICONS: Record<MediaSection, IconSvgElement> = {
  video: PlayIcon,
  music: MusicNote01Icon,
  radio: Radio01Icon,
}

function metaParts(item: AdminMediaItem): string[] {
  const parts: string[] = []
  if (item.section === 'video') {
    if (item.duration) parts.push(item.duration)
    if (item.plays !== null) parts.push(`${formatCount(item.plays)} plays`)
  } else if (item.section === 'music') {
    if (item.album) parts.push(item.album)
    if (item.duration) parts.push(item.duration)
    if (item.tempo) parts.push(item.tempo)
    if (item.songKey) parts.push(`Key ${item.songKey}`)
  } else {
    if (item.freq) parts.push(item.freq)
    if (item.listeners !== null) parts.push(`${formatCount(item.listeners)} listeners`)
  }
  return parts
}

function AttachmentChip({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <span
      title={title}
      className="rounded border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary uppercase"
    >
      {children}
    </span>
  )
}

function RowButton({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border border-border bg-surface-elevated p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'text-text-secondary hover:border-error/50 hover:text-error'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

type AdminMediaCardProps = {
  item: AdminMediaItem
  index: number
  count: number
  busy: boolean
  confirmingDelete: boolean
  onMove: (item: AdminMediaItem, direction: 'up' | 'down') => void
  onVisibility: (item: AdminMediaItem) => void
  onArmDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (item: AdminMediaItem) => void
}

export default function AdminMediaCard({
  item,
  index,
  count,
  busy,
  confirmingDelete,
  onMove,
  onVisibility,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: AdminMediaCardProps) {
  const parts = metaParts(item)
  const SectionIcon = SECTION_ICONS[item.section]
  const previewable = item.section === 'video' || (item.section === 'music' && item.sourceUrl !== null)
  const coverUrl = item.coverUrl
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)
  const showCover = coverUrl !== null && coverUrl !== failedCoverUrl

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative">
        {showCover ? (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedCoverUrl(coverUrl)}
            className="aspect-[4/3] w-full bg-surface-elevated object-cover"
          />
        ) : (
          <div
            className="flex aspect-[4/3] w-full items-center justify-center bg-surface-elevated text-text-muted"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(244,244,242,0.035) 10px, rgba(244,244,242,0.035) 20px)',
            }}
          >
            <HugeiconsIcon icon={SectionIcon} size={28} />
          </div>
        )}
        {item.tag && (
          <span className="absolute top-2 left-2 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-text-primary uppercase">
            {item.tag}
          </span>
        )}
        <span
          className={`absolute top-2 right-2 rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${
            item.isActive ? STATUS_STYLES.live : STATUS_STYLES.hidden
          }`}
        >
          {item.isActive ? 'Live' : 'Hidden'}
        </span>
      </div>

      <div className="px-3.5 pt-3 pb-2.5">
        <p className="line-clamp-2 font-heading text-base leading-tight font-bold tracking-wide uppercase">
          {item.title}
        </p>
        {(item.artist ?? item.subtitle) && (
          <p className="mt-0.5 truncate text-[10px] text-text-muted">
            {item.artist ?? item.subtitle}
          </p>
        )}
        {(item.sourceUrl || item.coverUrl) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.sourceUrl && (
              <AttachmentChip title={item.sourceName ?? undefined}>
                {item.sourceUrl.endsWith('.mp3') ? 'MP3 file' : 'MP4 file'}
              </AttachmentChip>
            )}
            {item.coverUrl && <AttachmentChip title={item.coverName ?? undefined}>Cover</AttachmentChip>}
          </div>
        )}
        {parts.length > 0 && (
          <p className="mt-2 text-[10px] tracking-widest text-text-muted uppercase">
            {parts.join(' · ')}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border px-3.5 py-2">
        {previewable && (
          <Link
            to="/studio/player-queue"
            state={{ autoplay: true, item }}
            aria-label={`Play ${item.title}`}
            title={`Play ${item.title}`}
            className="rounded-lg border border-primary/40 bg-primary-soft/40 p-2 text-primary transition hover:border-primary hover:bg-primary-soft"
          >
            <HugeiconsIcon icon={PlayIcon} size={13} />
          </Link>
        )}
        <RowButton
          label={`Move ${item.title} earlier`}
          disabled={busy || index === 0}
          onClick={() => onMove(item, 'up')}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
        </RowButton>
        <RowButton
          label={`Move ${item.title} later`}
          disabled={busy || index === count - 1}
          onClick={() => onMove(item, 'down')}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
        </RowButton>
        <RowButton
          label={item.isActive ? `Hide ${item.title}` : `Show ${item.title}`}
          disabled={busy}
          onClick={() => onVisibility(item)}
        >
          <HugeiconsIcon icon={item.isActive ? ViewOffSlashIcon : ViewIcon} size={13} />
        </RowButton>
        <Link
          to={`/admin/media/${item.id}`}
          aria-label={`Edit ${item.title}`}
          title={`Edit ${item.title}`}
          className="rounded-lg border border-border bg-surface-elevated p-2 text-text-secondary transition hover:text-text-primary"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
        </Link>
        {confirmingDelete ? (
          <span className="flex flex-wrap items-center gap-2 rounded-lg border border-error/50 bg-error/10 py-1 pr-1 pl-3">
            <span className="text-[10px] font-bold tracking-widest text-error uppercase">
              Delete permanently?
            </span>
            <button
              type="button"
              aria-label={`Confirm delete ${item.title}`}
              disabled={busy}
              onClick={() => onDelete(item)}
              className="rounded-md bg-error px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-text-primary uppercase transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirm
            </button>
            <button
              type="button"
              aria-label={`Cancel delete ${item.title}`}
              disabled={busy}
              onClick={onCancelDelete}
              className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-text-secondary uppercase transition hover:text-text-primary"
            >
              Cancel
            </button>
          </span>
        ) : (
          <RowButton
            label={`Delete ${item.title}`}
            danger
            disabled={busy}
            onClick={() => onArmDelete(item.id)}
          >
            <HugeiconsIcon icon={Delete01Icon} size={13} />
          </RowButton>
        )}
      </div>
    </li>
  )
}
