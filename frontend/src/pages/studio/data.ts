import type { IconSvgElement } from '@hugeicons/react'
import type { Location } from 'react-router'
import {
  CalendarCheck01Icon,
  HeadphonesIcon,
  HistoryIcon,
  Home01Icon,
  Mic01Icon,
  MusicNote02Icon,
  Playlist01Icon,
  Radio01Icon,
  UserIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'

export interface StudioNavItem {
  label: string
  icon: IconSvgElement
  /** Target URL. Absent = no page yet, rendered as an aria-disabled row. */
  to?: string
  /** Match the whole URL instead of a prefix (home + the homepage filters). */
  exact?: boolean
}

export interface StudioNavGroup {
  label: string
  items: StudioNavItem[]
}

export const studioNavGroups: StudioNavGroup[] = [
  {
    label: 'Browse',
    items: [
      { label: 'Home', to: '/studio', icon: Home01Icon, exact: true },
      { label: 'Video Songs', to: '/studio?filter=ktv', icon: Video01Icon, exact: true },
      { label: 'Music Library', to: '/studio?filter=music', icon: MusicNote02Icon, exact: true },
      { label: 'Radio', to: '/studio?filter=radio', icon: Radio01Icon, exact: true },
    ],
  },
  {
    label: 'Studio & Practice',
    items: [
      { label: 'Karaoke Rehearsal', to: '/studio/player-queue', icon: Mic01Icon },
      { label: 'Studio Bookings', to: '/studio/bookings', icon: CalendarCheck01Icon },
    ],
  },
  {
    label: 'Your Library',
    items: [
      // No listening-room route exists yet; same convention as the landing nav.
      { label: 'Listening Room', icon: HeadphonesIcon },
      { label: 'Playlists', to: '/studio/playlists', icon: Playlist01Icon },
      { label: 'History', to: '/studio/history', icon: HistoryIcon },
      { label: 'Profile', to: '/studio/profile', icon: UserIcon },
    ],
  },
]

/** True when the sidebar row for `item` should carry the active (red) treatment. */
export function studioNavActive(item: StudioNavItem, location: Location): boolean {
  if (!item.to) return false
  // The top-bar search box writes ?q=; it never changes which nav item is current.
  const params = new URLSearchParams(location.search)
  params.delete('q')
  const query = params.toString()
  const pathname =
    location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname
  const current = pathname + (query ? `?${query}` : '') + location.hash
  return item.exact ? current === item.to : current.startsWith(item.to)
}
