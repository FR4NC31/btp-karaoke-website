import { useId, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  LibraryIcon,
  PlusSignIcon,
  Queue01Icon,
  Radio01Icon,
  Share01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { PopoverContent } from '../../../components/ui/popover'
import { cn } from '../../../lib/utils'

type MediaCardMenuProps = {
  title: string
  subtitle: string
  len?: string | null
  coverUrl?: string | null
  fallbackIcon: IconSvgElement
  queueable: boolean
  queueKind?: 'video' | 'music'
  playlistable: boolean
  added: boolean
  queueCount: number
  onAdd: () => void
  onAddToPlaylist: () => void
}

type MenuRowProps = {
  icon: IconSvgElement
  label: string
  onClick?: () => void
  disabled?: boolean
  soon?: boolean
  active?: boolean
  success?: boolean
}

function MenuRow({
  icon,
  label,
  onClick,
  disabled = false,
  soon = false,
  active = false,
  success = false,
}: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-[13px] font-semibold transition',
        disabled
          ? success
            ? 'cursor-default text-primary'
            : 'cursor-not-allowed text-text-muted opacity-50'
          : 'hover:bg-surface-elevated hover:text-text-primary',
        active && !disabled && 'text-text-primary',
      )}
    >
      <HugeiconsIcon
        icon={icon}
        size={17}
        className={cn('shrink-0', (active || success) && !disabled && 'text-primary')}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {soon ? (
        <span
          aria-hidden="true"
          className="rounded border border-border px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-text-muted uppercase"
        >
          Soon
        </span>
      ) : null}
    </button>
  )
}

function UnavailableQueueRow({ kind }: { kind?: 'video' | 'music' }) {
  return (
    <div className="flex gap-3 px-2.5 py-2.5">
      <HugeiconsIcon
        icon={Queue01Icon}
        size={17}
        className="mt-0.5 shrink-0 text-text-muted"
      />
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
          Not available for the queue
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          {kind === 'music'
            ? 'This music row has no uploaded file yet, so the console would have nothing to play.'
            : 'Radio stations play live in their own player and cannot join the lounge queue.'}
        </p>
      </div>
    </div>
  )
}

export default function MediaCardMenu({
  title,
  subtitle,
  len,
  coverUrl,
  fallbackIcon,
  queueable,
  queueKind,
  playlistable,
  added,
  queueCount,
  onAdd,
  onAddToPlaylist,
}: MediaCardMenuProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)

  return (
    <PopoverContent
      align="end"
      side="top"
      sideOffset={8}
      collisionPadding={12}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="max-h-[calc(100dvh-1.5rem)] w-72 max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto border border-border bg-surface p-0 text-text-primary shadow-2xl"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {coverUrl && failedCoverUrl !== coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            onError={() => setFailedCoverUrl(coverUrl)}
            className="size-11 shrink-0 rounded-md bg-surface-elevated object-cover"
          />
        ) : (
          <div className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-elevated text-text-muted">
            <HugeiconsIcon icon={fallbackIcon} size={20} />
          </div>
        )}
        <div className="min-w-0">
          <h2
            id={titleId}
            className="truncate font-heading text-sm leading-tight font-bold tracking-wide uppercase"
          >
            {title}
          </h2>
          <p id={descriptionId} className="mt-0.5 truncate text-[10px] text-text-muted">
            {subtitle}
            {len ? ` · ${len}` : ''}
          </p>
        </div>
      </div>

      <div className="p-1.5">
        <MenuRow icon={LibraryIcon} label="Add to Your Library" disabled soon />
        {queueable ? (
          <MenuRow
            icon={added ? Tick02Icon : Queue01Icon}
            label={added ? 'Added to queue' : 'Add to queue'}
            onClick={onAdd}
            disabled={added}
            active
            success={added}
          />
        ) : (
          <UnavailableQueueRow kind={queueKind} />
        )}
        <MenuRow icon={Radio01Icon} label="Go to artist radio" disabled soon />
        <div className="my-1.5 h-px bg-border" />
        <MenuRow
          icon={PlusSignIcon}
          label="Add to playlist"
          onClick={playlistable ? onAddToPlaylist : undefined}
          disabled={!playlistable}
        />
        <MenuRow icon={Share01Icon} label="Share" disabled soon />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <Link
          to="/studio/player-queue"
          className="text-[11px] font-semibold text-text-secondary transition hover:text-text-primary"
        >
          Open lounge queue
        </Link>
        <span className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
          {queueCount > 0 ? `${queueCount} waiting` : 'Empty'}
        </span>
      </div>
    </PopoverContent>
  )
}
