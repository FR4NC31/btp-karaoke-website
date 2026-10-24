import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MusicNote02Icon,
  Playlist01Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '../../../../lib/utils'
import type { MediaItem } from '../../../../lib/media-api'
import {
  TONE_TILES,
  type PlaylistTone,
  type PlaylistTrack,
} from './mock-playlists'

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
  icon: typeof MusicNote02Icon
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
          className="size-full object-cover object-center"
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

  // Cover art first: a playlist can hold seed rows without artwork plus an
  // uploaded song whose thumbnail we do have. Surface that thumbnail on the
  // card instead of hiding it behind three icon tiles.
  const orderedTracks = tracks
    .map((track) => ({
      track,
      cover:
        track.coverUrl ??
        byTitle.get(titleKey(track.title))?.coverUrl ??
        null,
    }))
    .sort((a, b) => Number(Boolean(b.cover)) - Number(Boolean(a.cover)))

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative grid h-full w-full grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-border',
        className,
      )}
    >
      {Array.from({ length: 4 }, (_, index) => {
        const tile = orderedTracks[index]
        const track = tile?.track
        const icon = track
          ? track.kind === 'video'
            ? Video01Icon
            : MusicNote02Icon
          : Playlist01Icon

        return (
          <MosaicTile
            key={track?.id ?? `empty-${index}`}
            cover={tile?.cover ?? null}
            background={TONE_TILES[tone][index] ?? TONE_TILES.charcoal[0]}
            icon={icon}
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
