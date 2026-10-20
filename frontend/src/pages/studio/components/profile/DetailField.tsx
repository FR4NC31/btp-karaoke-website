import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'

type DetailFieldProps = {
  icon?: IconSvgElement
  label: string
  value: string
  hint: string
  verified?: boolean
}

/** One label/value/hint cell in the profile detail grids. */
export default function DetailField({ icon, label, value, hint, verified }: DetailFieldProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
        {icon && <HugeiconsIcon icon={icon} size={12} />}
        {label}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold break-words text-text-primary">
        {value}
        {verified && (
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={14}
            role="img"
            aria-label="Verified"
            className="shrink-0 text-success"
          />
        )}
      </p>
      <p className={`mt-0.5 text-[11px] ${verified ? 'text-success' : 'text-text-muted'}`}>{hint}</p>
    </div>
  )
}
