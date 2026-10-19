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
    await expect(playerBar.getByText('The Reason')).toBeVisible()
    await expect(playerBar.getByText('Hoobastank')).toBeVisible()
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

  test('PLAYER-009: studio entry does not autoplay the lobby music', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    const audio = page.locator('audio')
    // Metadata proves the mount effects ran. Under the old behaviour the
    // mount play() would already have set paused = false here (Chromium
    // allows autoplay) — now the entry must stay silent.
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).readyState))
      .toBeGreaterThanOrEqual(2)
    await expect(audio).toHaveJSProperty('paused', true)
    expect(await audio.evaluate((el) => (el as HTMLAudioElement).played.length)).toBe(0)
    // The bar offers the choice instead: a paused transport showing Play.
    await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('PLAYER-006: progress display shows current and total time', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    const playerBar = page.getByRole('contentinfo')
    // The bar mirrors the real lobby music transport: total time is the
    // placeholder track's length; current time sits at 0:00 until playback
    // starts (the studio never autoplays the lobby — PLAYER-009).
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
