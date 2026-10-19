import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Settle the lobby music before a spec drives the bar's Play/Pause toggle.
 *
 * The hub never autoplays (the lobby starts only from a real user choice),
 * so the track should already be paused — but metadata may still be
 * loading, and a Play click must not race that load. Wait for metadata,
 * pause it if something started it anyway, and only return a bar that
 * shows 'Play'.
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
