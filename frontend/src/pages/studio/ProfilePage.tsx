import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  CalendarCheck01Icon,
  HeartIcon,
  HistoryIcon,
  MusicNote01Icon,
  Playlist01Icon,
  PlayIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { useSession } from '../../lib/auth-client'
import type { KaraokeVideoApi } from '../../lib/karaoke-player'
import { usePlaylistLibrary } from '../../lib/playlist-library'
import { usePlayHistory } from '../../lib/play-history'
import { cn } from '../../lib/utils'
import EmptyState from './components/EmptyState'
import { HistoryBody } from './components/history/HistoryParts'
import AvatarEditor from './components/profile/AvatarEditor'
import PlaylistMosaic from './components/playlists/PlaylistMosaic'
import { playlistDuration } from './components/playlists/mock-playlists'
import { usePlaylistCatalog } from './components/playlists/use-playlist-catalog'
import type { PlaylistTrack } from './components/playlists/mock-playlists'

type ProfileTab = 'favorites' | 'playlists' | 'history'

const TABS: { id: ProfileTab; label: string; icon: IconSvgElement }[] = [
  { id: 'favorites', label: 'Favorites', icon: HeartIcon },
  { id: 'playlists', label: 'Playlists', icon: Playlist01Icon },
  { id: 'history', label: 'History', icon: HistoryIcon },
]

const primaryAction =
  'rounded-lg bg-primary-soft bg-gradient-to-r from-primary to-primary-hover px-4 py-2 text-xs font-semibold text-text-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

function FavoriteCard({ track }: { track: PlaylistTrack }) {
  const library = usePlaylistLibrary()
  const navigate = useNavigate()
  const isMusic = track.kind === 'music'

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-primary/50">
      <div className="relative aspect-square overflow-hidden bg-surface-elevated">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-text-muted">
            <HugeiconsIcon icon={isMusic ? MusicNote01Icon : Video01Icon} size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/30" />

        <span
          className={cn(
            'absolute top-2 left-2 rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
            isMusic
              ? 'border border-white/15 bg-black/70 text-text-primary'
              : 'bg-primary text-text-primary',
          )}
        >
          {isMusic ? 'MP3' : 'KTV'}
        </span>

        <button
          type="button"
          aria-label={`Like ${track.title}`}
          aria-pressed
          onClick={() =>
            library.toggleLiked({
              title: track.title,
              artist: track.artist,
              duration: track.duration || undefined,
              coverUrl: track.coverUrl,
              sourceUrl: track.sourceUrl,
              mediaId: track.mediaId,
              kind: track.kind,
            })
          }
          title="Remove from Liked Songs"
          className="absolute top-2 right-2 grid size-7 place-items-center rounded text-primary transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          <HugeiconsIcon icon={HeartIcon} size={15} className="fill-current" />
        </button>

        {track.duration ? (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
            <HugeiconsIcon icon={PlayIcon} size={9} />
            {track.duration}
          </span>
        ) : null}
      </div>

      <div className="px-3.5 pt-2.5 pb-2.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-sm font-semibold text-text-primary">{track.title}</p>
          <button
            type="button"
            aria-label={`Play ${track.title}`}
            onClick={() =>
              navigate('/studio/player-queue', {
                state: {
                  autoplay: true,
                  item: {
                    id: track.mediaId ?? track.id,
                    section: track.kind === 'music' ? 'music' : 'video',
                    title: track.title,
                    subtitle: track.artist,
                    artist: track.artist,
                    tag: null,
                    duration: track.duration,
                    coverUrl: track.coverUrl,
                    sourceUrl: track.sourceUrl,
                    album: track.album,
                  },
                },
              })
            }
            className="grid size-7 place-items-center rounded text-text-muted transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            <HugeiconsIcon icon={PlayIcon} size={15} />
          </button>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-text-muted">{track.artist}</p>
      </div>
    </article>
  )
}

export default function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>('favorites')
  const [copied, setCopied] = useState(false)
  const { data, refetch } = useSession()
  const { likedSongs, userPlaylists } = usePlaylistLibrary()
  const { entries, error: historyError, retry: retryHistory } = usePlayHistory()
  const { items: catalog, byTitle, loaded } = usePlaylistCatalog()
  const player = useOutletContext<KaraokeVideoApi>()

  const user = data?.user
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || 'Your Name'
  const handle = user?.email ? `@${user.email.split('@')[0]}` : '@your_handle'
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  const favorites = likedSongs.tracks
  const stats = [
    { value: favorites.length, label: 'Favorites' },
    { value: userPlaylists.length, label: 'Playlists' },
    { value: entries?.length ?? 0, label: 'Plays' },
  ]

  async function shareProfile() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked (insecure context) — the button simply does nothing.
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl border border-border bg-surface px-6 py-10 text-center">
        <div className="relative mx-auto w-fit">
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              className="size-36 rounded-full border-2 border-primary object-cover"
            />
          ) : (
            <span className="grid size-36 place-items-center rounded-full border-2 border-primary bg-background text-4xl font-bold text-text-primary">
              {initials}
            </span>
          )}
          <AvatarEditor image={user?.image} onSaved={() => refetch()} />
        </div>

        <h1 className="mt-5 text-3xl font-bold text-text-primary">{fullName}</h1>
        <p className="mt-1 text-sm text-text-secondary">{handle}</p>

        <div className="mt-6 flex justify-center gap-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={shareProfile}
            className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-primary transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copied ? 'Link Copied' : 'Share Profile'}
          </button>
          <Link
            to="/studio/bookings"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-primary transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <HugeiconsIcon icon={CalendarCheck01Icon} size={15} className="text-primary" />
            Bookings
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-text-muted">
          Vocalist &amp; acoustic session artist • Rehearsing KTV classics and Minus-One masters at
          BTP Studio.
        </p>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div role="tablist" aria-label="Profile sections" className="flex border-b border-border">
          {TABS.map((entry) => {
            const active = tab === entry.id
            return (
              <button
                key={entry.id}
                type="button"
                id={`profile-tab-${entry.id}`}
                role="tab"
                aria-selected={active}
                aria-controls={`profile-panel-${entry.id}`}
                onClick={() => setTab(entry.id)}
                className={cn(
                  '-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  active
                    ? 'border-primary text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary',
                )}
              >
                <HugeiconsIcon
                  icon={entry.icon}
                  size={16}
                  className={active ? 'text-primary' : undefined}
                />
                {entry.label}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`profile-panel-${tab}`}
          aria-labelledby={`profile-tab-${tab}`}
          className="p-6"
        >
          {tab === 'favorites' ? (
            favorites.length > 0 ? (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
                {favorites.map((track) => (
                  <FavoriteCard key={track.id} track={track} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={HeartIcon}
                title="No favorites yet"
                description="Heart a song anywhere in the studio and it lands here for quick rehearsals."
                action={
                  <Link to="/studio?filter=ktv" className={primaryAction}>
                    Browse songs
                  </Link>
                }
              />
            )
          ) : null}

          {tab === 'playlists' ? (
            userPlaylists.length > 0 ? (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
                {userPlaylists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    to={`/studio/playlists/${playlist.id}`}
                    className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="aspect-square">
                      <PlaylistMosaic
                        tracks={playlist.tracks}
                        tone={playlist.tone}
                        byTitle={byTitle}
                      />
                    </div>
                    <div className="px-3.5 pt-2.5 pb-2.5 text-left">
                      <p className="line-clamp-1 text-sm font-semibold text-text-primary transition group-hover:text-primary">
                        {playlist.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}{' '}
                        · {playlistDuration(playlist.tracks)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Playlist01Icon}
                title="No playlists yet"
                description="Build a setlist on the Playlists page and it shows up here."
                action={
                  <Link to="/studio/playlists" className={primaryAction}>
                    Open Playlists
                  </Link>
                }
              />
            )
          ) : null}

          {tab === 'history' ? (
            historyError ? (
              <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-error/40 bg-error/10 px-4 py-4 text-xs text-error">
                <p className="flex-1">Your listening history could not be read from this browser.</p>
                <button type="button" onClick={retryHistory} className="rounded-lg border border-error/40 px-3 py-1.5 font-semibold">
                  Retry
                </button>
              </div>
            ) : loaded ? (
              <HistoryBody
                entries={entries}
                filter="all"
                items={catalog}
                player={player}
                render={(cards) => (
                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
                    {cards}
                  </div>
                )}
              />
            ) : (
              <div role="status" className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
                <span className="sr-only">Loading listening history</span>
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="h-44 animate-pulse rounded-xl bg-surface-elevated/60"
                  />
                ))}
              </div>
            )
          ) : null}
        </div>
      </section>
    </div>
  )
}
