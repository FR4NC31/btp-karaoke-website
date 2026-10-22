import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DiscAlbumIcon,
  Mic01Icon,
  MusicNote02Icon,
  Playlist01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '../../../../lib/utils'
import type { MediaItem } from '../../../../lib/media-api'
import {
  TONE_TILES,
  type PlaylistTone,
  type PlaylistTrack,
} from './mock-playlists'

const TILE_ICONS = [MusicNote02Icon, Mic01Icon, DiscAlbumIcon, Playlist01Icon]

function titleKey(value: string): string {
  return value.trim().toLowerCase()
}

function MosaicTile({
  cover,
  background,
  icon,
}: {
  cover: string | null
  background: string
  icon: (typeof TILE_ICONS)[number]
}) {
  const [failed, setFailed] = useState(false)

  if (cover && !failed) {
    return (
      <div className="relative overflow-hidden bg-surface-elevated">
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden bg-surface-elevated"
      style={{ backgroundImage: background }}
    >
      <HugeiconsIcon
        icon={icon}
        size={30}
        className="absolute inset-0 m-auto text-white/10"
      />
    </div>
  )
}

export default function PlaylistMosaic({
  tracks,
  tone,
  byTitle,
  className,
}: {
  tracks: PlaylistTrack[]
  tone: PlaylistTone
  byTitle: Map<string, MediaItem>
  className?: string
}) {
  const empty = tracks.length === 0

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative grid h-full w-full grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-border',
        className,
      )}
    >
      {Array.from({ length: 4 }, (_, index) => {
        const track = tracks[index]
        const cover =
          track?.coverUrl ??
          (track ? byTitle.get(titleKey(track.title))?.coverUrl : null) ??
          null

        return (
          <MosaicTile
            key={track?.id ?? `empty-${index}`}
            cover={cover}
            background={TONE_TILES[tone][index] ?? TONE_TILES.charcoal[0]}
            icon={TILE_ICONS[index] ?? MusicNote02Icon}
          />
        )
      })}

      {empty ? (
        <div className="absolute inset-0 grid place-items-center bg-background/25">
          <span className="grid size-12 place-items-center rounded-full border border-white/10 bg-black/35 text-text-muted backdrop-blur">
            <HugeiconsIcon icon={Playlist01Icon} size={22} />
          </span>
        </div>
      ) : null}
    </div>
  )
}
