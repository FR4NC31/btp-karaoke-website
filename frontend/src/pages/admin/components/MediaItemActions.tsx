import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Delete01Icon,
  PencilEdit01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import type { AdminMediaItem } from '../../../lib/media-api'

function ActionButton({
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
      className={`grid size-7 place-items-center rounded-md border border-border bg-surface-elevated text-text-secondary transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'hover:border-error/50 hover:text-error'
          : 'hover:border-primary/50 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

type MediaItemActionsProps = {
  item: AdminMediaItem
  busy: boolean
  confirmingDelete: boolean
  onVisibility: (item: AdminMediaItem) => void
  onArmDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (item: AdminMediaItem) => void
}

/**
 * The per-item control cluster shared by the grid card and the list row:
 * hide/show, edit, and the armed delete. Names match the E2E pins
 * (`Hide {title}`, `Confirm delete {title}`, …).
 */
export default function MediaItemActions({
  item,
  busy,
  confirmingDelete,
  onVisibility,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: MediaItemActionsProps) {
  if (confirmingDelete) {
    return (
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
    )
  }

  return (
    <>
      <ActionButton
        label={item.isActive ? `Hide ${item.title}` : `Show ${item.title}`}
        disabled={busy}
        onClick={() => onVisibility(item)}
      >
        <HugeiconsIcon icon={item.isActive ? ViewOffSlashIcon : ViewIcon} size={13} />
      </ActionButton>
      <Link
        to={`/admin/media/${item.id}`}
        aria-label={`Edit ${item.title}`}
        title={`Edit ${item.title}`}
        aria-disabled={busy || undefined}
        className={`grid size-7 place-items-center rounded-md border border-border bg-surface-elevated text-text-secondary transition ${
          busy
            ? 'pointer-events-none opacity-40'
            : 'hover:border-primary/50 hover:text-text-primary'
        }`}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
      </Link>
      <ActionButton label={`Delete ${item.title}`} danger disabled={busy} onClick={() => onArmDelete(item.id)}>
        <HugeiconsIcon icon={Delete01Icon} size={13} />
      </ActionButton>
    </>
  )
}

/** Small square icon used where a row has no play action (e.g. radio). */
export function PreviewSpacerIcon({ icon }: { icon: IconSvgElement }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-text-muted">
      <HugeiconsIcon icon={icon} size={14} />
    </span>
  )
}
