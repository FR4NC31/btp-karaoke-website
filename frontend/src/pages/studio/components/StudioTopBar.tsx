import { Link, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Search01Icon,
  ChevronDownIcon,
  HeadphonesIcon,
  Mic01Icon,
  BellIcon,
  CalendarCheck01Icon,
  Playlist01Icon,
  Queue01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'
import BrandLogo from '../../../components/BrandLogo'
import { useSession } from '../../../lib/auth-client'
import ProfileMenu from './ProfileMenu'

export default function StudioTopBar() {
  const { pathname } = useLocation()
  const showBack = pathname !== '/studio'
  const onQueue = pathname.startsWith('/studio/player-queue')
  const onPlaylists = pathname.startsWith('/studio/playlists')
  const onPlaylistDetail = pathname.startsWith('/studio/playlists/')
  const backTo = onPlaylistDetail ? '/studio/playlists' : '/studio'
  const { data } = useSession()
  const isAdmin = data?.user.role === 'admin'

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:gap-4 sm:px-4">
      <div className="flex shrink-0 items-center gap-3">
        {showBack && (
          <Link
            to={backTo}
            aria-label="Back"
            title={onPlaylistDetail ? 'Back to playlists' : 'Back to studio'}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
        )}
        <BrandLogo className="size-9 shrink-0 rounded-md" />
        <div className="hidden leading-tight sm:block">
          <div className="flex items-center gap-2">
            <p className="font-heading text-lg font-bold tracking-wide">BTP MUSIC PRODUCTION</p>
            <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-text-primary uppercase">
              FILSCAP Archive
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Sonic Music Engine v4.2 · 320kbps FLAC
          </p>
        </div>
      </div>

      <button
        type="button"
        className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary lg:flex"
      >
        All Vaults
        <HugeiconsIcon icon={ChevronDownIcon} size={14} />
      </button>

      <div className="relative mx-auto w-full min-w-0 max-w-md">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          placeholder="Search master recordings, multitracks, stems..."
          className="w-full rounded-lg border border-border bg-background py-2 pr-12 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          to="/studio/playlists"
          aria-label="Playlists"
          title="Playlists"
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition lg:px-3 ${
            onPlaylists
              ? 'border-primary/50 bg-primary-soft text-primary'
              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <HugeiconsIcon icon={Playlist01Icon} size={15} />
          <span className="hidden lg:inline">Playlists</span>
        </Link>
        <Link
          to={onQueue ? '/studio' : '/studio/player-queue'}
          aria-label={onQueue ? 'Minimize player queue' : 'Player Queue'}
          title={onQueue ? 'Minimize player queue' : 'Open player queue'}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition lg:px-3 ${
            onQueue
              ? 'border-primary/50 bg-primary-soft text-primary'
              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <HugeiconsIcon icon={Queue01Icon} size={15} />
          <span className="hidden lg:inline">Queue</span>
        </Link>
        <Link
          to="/studio/bookings"
          aria-label="Bookings"
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition lg:px-3 ${
            pathname.startsWith('/studio/bookings')
              ? 'border-primary/50 bg-primary-soft text-primary'
              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <HugeiconsIcon icon={CalendarCheck01Icon} size={15} />
          <span className="hidden lg:inline">Bookings</span>
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            aria-label="Admin Console"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary lg:px-3"
          >
            <HugeiconsIcon icon={Shield01Icon} size={15} />
            <span className="hidden lg:inline">Admin</span>
          </Link>
        )}
        <span className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary xl:flex">
          <HugeiconsIcon icon={HeadphonesIcon} size={15} />
          Listening Room
        </span>
        <span className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary xl:flex">
          <HugeiconsIcon icon={Mic01Icon} size={15} />
          Karaoke Rehearsal
        </span>
        <button
          type="button"
          aria-label="Notifications"
          className="grid size-8 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
        >
          <HugeiconsIcon icon={BellIcon} size={17} />
        </button>
        <ProfileMenu />
      </div>
    </header>
  )
}
