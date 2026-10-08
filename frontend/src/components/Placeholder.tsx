import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { MusicNote01Icon } from '@hugeicons/core-free-icons'

interface PlaceholderProps {
  icon?: IconSvgElement
  iconSize?: number
  className?: string
}

export default function Placeholder({ icon = MusicNote01Icon, iconSize = 24, className = '' }: PlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center bg-surface-elevated text-text-muted ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(244,244,242,0.02) 8px, rgba(244,244,242,0.02) 16px)',
      }}
    >
      <HugeiconsIcon icon={icon} size={iconSize} />
    </div>
  )
}
