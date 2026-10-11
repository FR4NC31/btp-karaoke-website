import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import StudioTopBar from './components/StudioTopBar'
import StudioSidebar from './components/StudioSidebar'
import PlayerBar from './components/PlayerBar'
import StudioSkeleton from './components/StudioSkeleton'

/** Simulated load time for the /studio content skeleton (3.5 s). */
const SKELETON_MS = 3500

/**
 * Studio layout shell: top bar, sidebar, scrolling main region (the routed
 * page renders through <Outlet/>) and the player bar.
 *
 * Extracted so /studio (discovery) and /studio/profile (account) share one
 * chrome. PlayerBar stays a direct child of the shell root so its <footer>
 * keeps role contentinfo (E2E pin).
 *
 * On first mount the main region shows StudioSkeleton for 3.5 s, then the
 * real route content. Chrome (top bar, sidebar, player) stays live the whole
 * time so E2E pins for those regions never wait.
 */
export default function StudioShell() {
  const [loading, setLoading] = useState(true)

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
          {loading ? <StudioSkeleton /> : <Outlet />}
        </main>
      </div>

      <PlayerBar />
    </div>
  )
}
