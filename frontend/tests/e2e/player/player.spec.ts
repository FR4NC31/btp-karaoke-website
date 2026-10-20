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

  test('PLAYER-009: studio entry does not autoplay the lobby music or show the bar', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    const audio = page.locator('audio')
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).readyState))
      .toBeGreaterThanOrEqual(2)
    await expect(audio).toHaveJSProperty('paused', true)
    expect(await audio.evaluate((el) => (el as HTMLAudioElement).played.length)).toBe(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
  })

  test('PLAYER-006: progress display shows current and total time', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar.getByText('3:54')).toBeVisible()
    await expect(playerBar.getByText(/^\d+:\d{2}$/).first()).toBeVisible()
  })

  test('PLAYER-008: like toggles player state', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const playerBar = page.getByRole('contentinfo')
    const likeButton = playerBar.getByRole('button', { name: 'Like' })
    await expect(likeButton).toHaveClass(/text-text-muted/)
    await likeButton.click()
    await expect(likeButton).toHaveClass(/text-primary/)
    await likeButton.click()
    await expect(likeButton).toHaveClass(/text-text-muted/)
  })
})
