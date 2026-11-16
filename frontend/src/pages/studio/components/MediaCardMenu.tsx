import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { PlusSignIcon, Queue01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { PopoverContent } from '../../../components/ui/popover'
import { cn } from '../../../lib/utils'

type MediaCardMenuProps = {
  /** Also the popover's accessible name (no header block since the redesign). */
  title: string
  queueable: boolean
  playlistable: boolean
  added: boolean
  onAdd: () => void
  onAddToPlaylist: () => void
}

type MenuRowProps = {
  icon: IconSvgElement
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  success?: boolean
}

function MenuRow({
  icon,
  label,
  onClick,
  disabled = false,
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
    </button>
  )
}

/** Card ⋯ menu: exactly the two actions from the design mockup. */
export default function MediaCardMenu({
  title,
  queueable,
  playlistable,
  added,
  onAdd,
  onAddToPlaylist,
}: MediaCardMenuProps) {
  return (
    <PopoverContent
      align="end"
      side="top"
      sideOffset={8}
      collisionPadding={12}
      aria-label={title}
      className="w-56 max-w-[calc(100vw-1.5rem)] border border-border bg-surface p-1.5 text-text-primary shadow-2xl"
    >
      <MenuRow
        icon={PlusSignIcon}
        label="Add to Playlist"
        onClick={playlistable ? onAddToPlaylist : undefined}
        disabled={!playlistable}
      />
      <MenuRow
        icon={added ? Tick02Icon : Queue01Icon}
        label={added ? 'Added to Queue' : 'Add to Queue'}
        onClick={onAdd}
        disabled={!queueable || added}
        active
        success={added}
      />
    </PopoverContent>
  )
}
