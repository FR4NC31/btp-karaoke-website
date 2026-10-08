import { test, expect } from '../fixtures'

/**
 * PLAYER — the Studio player bar.
 *
 * Scope note: the prototype player is UI state only — there is no <audio>
 * element, no media file and no progress simulation. These tests cover the
 * controls that actually exist (play/pause toggle, like toggle, display).
 * Media loading failure and real playback are N/A
 * (docs/testing/test-cases.md).
 */
test.describe('player', () => {
  test('PLAYER-001: player bar shows the current track', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar).toBeVisible()
    await expect(playerBar.getByText('Die With A Smile (Cover)')).toBeVisible()
    await expect(playerBar.getByText('Lady Gaga & Bruno Mars')).toBeVisible()
  })

  test('PLAYER-003: playback starts', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
    await playerBar.getByRole('button', { name: 'Play' }).click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('PLAYER-004: pause and resume work', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    const playerBar = page.getByRole('contentinfo')
    const toggle = playerBar.getByRole('button', { name: /Play|Pause/ })

    await toggle.click() // start
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await toggle.click() // pause
    await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
    await toggle.click() // resume
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('PLAYER-006: progress display shows current and total time', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    const playerBar = page.getByRole('contentinfo')
    // Static display values in the prototype (progress is not simulated).
    await expect(playerBar.getByText('1:24')).toBeVisible()
    await expect(playerBar.getByText('4:11')).toBeVisible()
  })

  test('PLAYER-008: like toggles player state', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    const likeButton = page.getByRole('button', { name: 'Like' })
    // Active like state is currently styling-only (no aria-pressed yet).
    await expect(likeButton).toHaveClass(/text-text-muted/)
    await likeButton.click()
    await expect(likeButton).toHaveClass(/text-primary/)
    await likeButton.click() // unlike must work too
    await expect(likeButton).toHaveClass(/text-text-muted/)
  })
})
