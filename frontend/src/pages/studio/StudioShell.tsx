import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import StudioTopBar from './components/StudioTopBar'
import StudioSidebar from './components/StudioSidebar'
import PlayerBar from './components/PlayerBar'
import StudioBgm from './components/StudioBgm'
import StudioPip from './components/StudioPip'
import StudioSkeleton from './components/StudioSkeleton'
import { useKaraokeVideo } from '../../lib/karaoke-player'
import { LoungeQueueProvider, useLoungeQueueState } from '../../lib/lounge-queue'

const SKELETON_MS = 3500

export default function StudioShell() {
  const [loading, setLoading] = useState(true)
  const player = useKaraokeVideo()
  const queue = useLoungeQueueState()
  const { pathname } = useLocation()

  const skipSkeleton = pathname.startsWith('/studio/player-queue')
  const showPlayerBar = player.started || pathname === '/studio/player-queue'

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), SKELETON_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background text-text-primary">
      <StudioTopBar />

      <div className="flex min-h-0 flex-1">
        <StudioSidebar />

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          {loading && !skipSkeleton ? (
            <StudioSkeleton />
          ) : (
            <LoungeQueueProvider api={queue}>
              <Outlet context={player} />
            </LoungeQueueProvider>
          )}
        </main>
      </div>

      {showPlayerBar && <PlayerBar player={player} />}
      <StudioBgm player={player} />
      <StudioPip player={player} />
    </div>
  )
}
