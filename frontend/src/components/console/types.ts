import type { AdminMediaItem, MediaItem } from '../../lib/media-api'

/**
 * The catalog row the console is playing: the hub fields every entry point
 * carries, plus the admin bookkeeping the Media Hub's Play button adds
 * (`sourceName`, `coverName`, `isActive`, timestamps).
 */
export type PreviewItem = MediaItem & Partial<AdminMediaItem>
