import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

type EmptyStateProps = {
  icon: IconSvgElement
  title: string
  description: string
  /** Optional primary action (button/link) styled by the caller. */
  action?: ReactNode
}

/** Centered panel for "nothing here" views — catalog, filtered tabs, no matches. */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-2xl border border-border bg-surface px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <HugeiconsIcon icon={icon} size={24} />
      </span>
      <h2 className="mt-4 text-xl leading-tight font-bold font-sans text-text-primary">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
