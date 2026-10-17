import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Settle the lobby music before a spec drives the bar's Play/Pause toggle.
 *
 * Playwright's Chromium allows autoplay, so StudioBgm's mount play() may
 * already be running (or still loading) when a test reaches the bar — a
 * Play click would then race the media and sometimes pause instead of play.
 * Wait for the track's metadata, pause it when it started on its own, and
 * only return a bar that shows 'Play'. Real browsers block the no-gesture
 * autoplay, so users never see this race.
 */
export async function settlePlayerBar(page: Page) {
  const audio = page.locator('audio')
  await expect
    .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).readyState))
    .toBeGreaterThanOrEqual(2)

  const playerBar = page.getByRole('contentinfo')
  if (!(await audio.evaluate((el) => (el as HTMLAudioElement).paused))) {
    await playerBar.getByRole('button', { name: 'Pause' }).click()
  }
  await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
}
