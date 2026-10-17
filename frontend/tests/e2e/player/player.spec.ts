import { test, expect } from '../fixtures'
import { settlePlayerBar } from '../helpers/player'

/**
 * PLAYER — the Studio player bar.
 *
 * The bar drives the shell transport: on /studio that is the lobby music
 * (StudioBgm's real <audio> — the hub behaviour tested here); on
 * /studio/player-queue the karaoke video (KARAOKE-006 covers that).
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
    await settlePlayerBar(page)
    const playerBar = page.getByRole('contentinfo')
    await playerBar.getByRole('button', { name: 'Play' }).click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('PLAYER-004: pause and resume work', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await settlePlayerBar(page)
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
    // The bar mirrors the real lobby music transport: total time is the
    // placeholder track's length; current time ticks (0:00 while autoplay
    // still waits for the first interaction).
    await expect(playerBar.getByText('3:54')).toBeVisible()
    await expect(playerBar.getByText(/^\d+:\d{2}$/).first()).toBeVisible()
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
