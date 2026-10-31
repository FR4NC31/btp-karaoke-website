import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import StudioTopBar from './components/StudioTopBar'
import StudioSidebar from './components/StudioSidebar'
import PlayerBar from './components/PlayerBar'
import StudioPlayer from './components/StudioPlayer'
import StudioSkeleton from './components/StudioSkeleton'
import ProfileSkeleton from './components/profile/ProfileSkeleton'
import { useKaraokeVideo, type OnAirTrack } from '../../lib/karaoke-player'
import { LoungeQueueProvider, useLoungeQueueState } from '../../lib/lounge-queue'
import { PlaylistLibraryProvider, usePlaylistLibraryState } from '../../lib/playlist-library'
import RequiredProfileModal from '../../components/RequiredProfileModal'

const SKELETON_MS = 3500
const FALLBACK_ON_AIR: OnAirTrack = {
  title: 'The Reason',
  subtitle: 'Hoobastank',
  src: '',
  coverUrl: null,
  kind: 'video',
  mediaId: null,
  album: 'KTV Master',
  duration: '3:54',
}

export default function StudioShell() {
  const [loading, setLoading] = useState(true)
  const player = useKaraokeVideo()
  const queue = useLoungeQueueState()
  const playlistLibrary = usePlaylistLibraryState()
  const { pathname } = useLocation()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const onConsoleRoute = pathname.startsWith('/studio/player-queue')
  // Reset the overlay when the user navigates away (done during render to
  // avoid cascading effect state updates).
  if (prevPathname !== pathname) {
    if (onConsoleRoute && !overlayOpen) {
      const origin =
        prevPathname && !prevPathname.startsWith('/studio/player-queue')
          ? prevPathname
          : '/studio'
      try {
        window.sessionStorage.setItem('playerQueueOrigin', origin)
      } catch {
        // Ignore storage failures.
      }
    }
    if (overlayOpen && !onConsoleRoute) setOverlayOpen(false)
    setPrevPathname(pathname)
  }
  const queueOpen = overlayOpen || onConsoleRoute
  const onQueue = queueOpen
  const onConsole = onQueue
  const currentOnAir = player.onAir ?? FALLBACK_ON_AIR
  const liked = playlistLibrary.isLiked({
    title: currentOnAir.title,
    artist: currentOnAir.subtitle,
    mediaId: currentOnAir.mediaId ?? null,
  })

  function toggleLiked() {
    playlistLibrary.toggleLiked({
      title: currentOnAir.title,
      artist: currentOnAir.subtitle,
      album: currentOnAir.album ?? undefined,
      duration: currentOnAir.duration ?? undefined,
      coverUrl: currentOnAir.coverUrl,
      sourceUrl: currentOnAir.src || null,
      mediaId: currentOnAir.mediaId ?? null,
      kind: currentOnAir.kind,
    })
  }

  const onProfile = pathname.startsWith('/studio/profile')
  const onPlaylists = pathname.startsWith('/studio/playlists')
  const skipSkeleton = onConsole || onPlaylists
  const showPlayerBar = player.started || onConsole

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), SKELETON_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background text-text-primary">
      <StudioTopBar />

      <div className="flex min-h-0 flex-1">
        <StudioSidebar />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <LoungeQueueProvider api={queue}>
            <PlaylistLibraryProvider api={playlistLibrary}>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {loading && !skipSkeleton ? (
                  onProfile ? <ProfileSkeleton /> : <StudioSkeleton />
                ) : (
                  <Outlet context={player} />
                )}
              </div>

              <StudioPlayer
                player={player}
                queueOpen={queueOpen}
                onToggleQueue={() => setOverlayOpen((open) => !open)}
              />
            </PlaylistLibraryProvider>
          </LoungeQueueProvider>
        </main>
      </div>

      {showPlayerBar && (
        <PlayerBar
          player={player}
          liked={liked}
          onToggleLiked={toggleLiked}
          queueOpen={queueOpen}
          onToggleQueue={() => setOverlayOpen((open) => !open)}
        />
      )}

      <RequiredProfileModal />
    </div>
  )
}
