import { test, expect } from '../fixtures'
import { settlePlayerBar } from '../helpers/player'

test.describe('player', () => {
  test('PLAYER-001: player bar appears with the current track once playback starts', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByRole('contentinfo')).toHaveCount(0)

    await page.getByRole('link', { name: 'Play The Reason' }).click()
    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar).toBeVisible()
    await expect(playerBar.getByText('The Reason')).toBeVisible()
    await expect(playerBar.getByText('Hoobastank')).toBeVisible()
  })

  test('PLAYER-003: playback starts', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    await settlePlayerBar(page)
    const playerBar = page.getByRole('contentinfo')
    await playerBar.getByRole('button', { name: 'Play' }).click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('PLAYER-004: pause and resume work', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    await settlePlayerBar(page)
    const playerBar = page.getByRole('contentinfo')
    const toggle = playerBar.getByRole('button', { name: /Play|Pause/ })

    await toggle.click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await toggle.click()
    await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
    await toggle.click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('PLAYER-009: studio entry does not autoplay or show the player bar', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    const video = page.locator('main video')
    await expect(video).toBeHidden()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(true)
    expect(await video.evaluate((el) => (el as HTMLVideoElement).played.length)).toBe(0)
    await expect(page.locator('audio')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
  })

  test('PLAYER-006: progress display shows current and total time', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar.getByText('3:54')).toBeVisible()
    await expect(playerBar.getByText(/^\d+:\d{2}$/).first()).toBeVisible()
  })

  test('PLAYER-010: direct console load retries the catalog after StrictMode cleanup', { tag: '@p2' }, async ({ page }) => {
    let catalogRequests = 0

    await page.route('**/api/media', async (route) => {
      catalogRequests += 1
      // Keep the first request in flight while StrictMode tears the first
      // effect down. Its response is ignored; the replacement effect must
      // still be allowed to ask again.
      if (catalogRequests === 1) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
      await route.continue()
    })

    await page.goto('/studio/player-queue')
    await expect.poll(() => catalogRequests).toBeGreaterThanOrEqual(2)
  })

  test('PLAYER-008: like toggles player state', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const playerBar = page.getByRole('contentinfo')
    const likeButton = playerBar.getByRole('button', { name: 'Like' })
    // The Reason seeds Liked Songs, so the placeholder track starts hearted.
    await expect(likeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(likeButton).toHaveClass(/text-primary/)
    await likeButton.click()
    await expect(likeButton).toHaveAttribute('aria-pressed', 'false')
    await expect(likeButton).toHaveClass(/text-text-muted/)
    await likeButton.click()
    await expect(likeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(likeButton).toHaveClass(/text-primary/)
  })
})
