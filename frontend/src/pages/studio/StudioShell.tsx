import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import StudioTopBar from './components/StudioTopBar'
import StudioSidebar from './components/StudioSidebar'
import PlayerBar from './components/PlayerBar'
import StudioPlayer from './components/StudioPlayer'
import StudioSkeleton from './components/StudioSkeleton'
import ProfileSkeleton from './components/profile/ProfileSkeleton'
import { useKaraokeVideo } from '../../lib/karaoke-player'
import { LoungeQueueProvider, useLoungeQueueState } from '../../lib/lounge-queue'
import { PlaylistLibraryProvider, usePlaylistLibraryState } from '../../lib/playlist-library'

const SKELETON_MS = 3500

export default function StudioShell() {
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const player = useKaraokeVideo()
  const queue = useLoungeQueueState()
  const playlistLibrary = usePlaylistLibraryState()
  const { pathname } = useLocation()

  const onConsole = pathname.startsWith('/studio/player-queue')
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

              <StudioPlayer player={player} />
            </PlaylistLibraryProvider>
          </LoungeQueueProvider>
        </main>
      </div>

      {showPlayerBar && (
        <PlayerBar
          player={player}
          liked={liked}
          onToggleLiked={() => setLiked((value) => !value)}
        />
      )}
    </div>
  )
}
