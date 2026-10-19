import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import StudioTopBar from './components/StudioTopBar'
import StudioSidebar from './components/StudioSidebar'
import PlayerBar from './components/PlayerBar'
import StudioBgm from './components/StudioBgm'
import StudioPip from './components/StudioPip'
import StudioSkeleton from './components/StudioSkeleton'
import { useKaraokeVideo } from '../../lib/karaoke-player'
import { useLoungeQueueState } from '../../lib/lounge-queue'

/** Simulated load time for the /studio content skeleton (3.5 s). */
const SKELETON_MS = 3500

/**
 * Studio layout shell: top bar, sidebar, scrolling main region (the routed
 * page renders through <Outlet/>) and the player bar.
 *
 * Extracted so /studio (discovery), /studio/profile (account) and
 * /studio/player-queue (console) share one chrome. PlayerBar stays a direct
 * child of the shell root so its <footer> keeps role contentinfo (E2E pin).
 *
 * The shell owns the video transport state (useKaraokeVideo): the routed page
 * registers its <video> through the outlet context and PlayerBar drives it.
 * It also owns the lounge queue (useLoungeQueueState), so a card's "Add to
 * queue" on the hub and the console's own queue edits share one list.
 * It also mounts StudioBgm — lobby background music, scoped to /studio routes
 * and silenced on the console where the karaoke video takes over.
 *
 * On first mount the main region shows StudioSkeleton for 3.5 s, then the
 * real route content. Chrome (top bar, sidebar, player) stays live the whole
 * time so E2E pins for those regions never wait.
 *
 * The console route (/studio/player-queue) is exempt: its content renders
 * immediately, without the (hub-shaped) skeleton flash.
 */
export default function StudioShell() {
  const [loading, setLoading] = useState(true)
  const player = useKaraokeVideo()
  const queue = useLoungeQueueState()
  const { pathname } = useLocation()

  // Temporary: the console skips the simulated skeleton delay — the
  // placeholder is shaped like the media hub, so it never matched the
  // console anyway. Restore by removing this guard (then the console waits
  // out SKELETON_MS like every other studio route).
  const skipSkeleton = pathname.startsWith('/studio/player-queue')

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
            <Outlet context={{ ...player, ...queue }} />
          )}
        </main>
      </div>

      <PlayerBar player={player} />
      <StudioBgm player={player} />
      <StudioPip player={player} />
    </div>
  )
}
