import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Search01Icon,
  CalendarCheck01Icon,
  Mic01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'
import { useSession } from '../../../lib/auth-client'
import ProfileMenu from './ProfileMenu'

export default function StudioTopBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showBack = pathname !== '/studio'
  const onQueue = pathname.startsWith('/studio/player-queue')
  const onPlaylistDetail = pathname.startsWith('/studio/playlists/')
  const backTo = onPlaylistDetail ? '/studio/playlists' : '/studio'
  const { data } = useSession()
  const isAdmin = data?.user.role === 'admin'

  // The search box owns ?q= so the homepage can filter the catalog from it.
  // replace keeps typing out of the history stack.
  const query = searchParams.get('q') ?? ''
  const setQuery = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    if (pathname === '/studio') setSearchParams(next, { replace: true })
    else navigate(`/studio?${next.toString()}`, { replace: true })
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
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

      <div className="relative hidden w-full min-w-0 max-w-lg sm:block">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, KTV videos, or Minus-One tracks..."
          aria-label="Search the catalog"
          className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          to={onQueue ? '/studio' : '/studio/player-queue'}

          title={onQueue ? 'Minimize the karaoke deck' : 'Open the karaoke deck'}
          /* bg-primary-soft is pinned by KARAOKE-016 while the deck is open;
             the gradient paints over it so the CTA matches the screenshot. */
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-soft bg-gradient-to-r from-primary to-primary-hover px-2.5 py-2 text-xs font-semibold text-text-primary shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:px-3"
        >
          <HugeiconsIcon icon={Mic01Icon} size={15} />
          <span className="hidden sm:inline">Karaoke Deck</span>
        </Link>
        <Link
          to="/studio/bookings"
          aria-label="Book Studio"
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition lg:px-3 ${
            pathname.startsWith('/studio/bookings')
              ? 'border-primary/50 bg-primary-soft text-primary'
              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <HugeiconsIcon icon={CalendarCheck01Icon} size={15} />
          <span className="hidden lg:inline">Book Studio</span>
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
        <ProfileMenu />
      </div>
    </header>
  )
}
