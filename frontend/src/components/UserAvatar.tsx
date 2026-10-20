import { useState } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import Placeholder from './Placeholder'

interface UserAvatarProps {
  image?: string | null
  icon?: IconSvgElement
  iconSize?: number
  className?: string
  alt?: string
}

export default function UserAvatar({
  image,
  icon,
  iconSize,
  className = '',
  alt = '',
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false)

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={alt}
        className={`object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    )
  }
  return <Placeholder icon={icon} iconSize={iconSize} className={className} />
}
