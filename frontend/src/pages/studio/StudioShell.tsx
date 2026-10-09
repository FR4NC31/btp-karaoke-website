import { Outlet } from 'react-router'
import StudioTopBar from './components/StudioTopBar'
import StudioSidebar from './components/StudioSidebar'
import PlayerBar from './components/PlayerBar'

/**
 * Studio layout shell: top bar, sidebar, scrolling main region (the routed
 * page renders through <Outlet/>) and the player bar.
 *
 * Extracted so /studio (discovery) and /studio/profile (account) share one
 * chrome. PlayerBar stays a direct child of the shell root so its <footer>
 * keeps role contentinfo (E2E pin).
 */
export default function StudioShell() {
  return (
    <div className="flex h-dvh flex-col bg-background text-text-primary">
      <StudioTopBar />

      <div className="flex min-h-0 flex-1">
        <StudioSidebar />

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <PlayerBar />
    </div>
  )
}
