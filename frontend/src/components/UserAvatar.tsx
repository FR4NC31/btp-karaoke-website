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

/**
 * Session-aware avatar. Renders the Better Auth `user.image` URL when set
 * (Google OAuth stores a googleusercontent profile pic; password users have
 * null and get the striped placeholder instead). Falls back to the placeholder
 * if the image fails to load.
 */
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
