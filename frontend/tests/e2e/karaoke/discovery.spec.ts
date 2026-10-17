import { test, expect } from '../fixtures'

/**
 * KARAOKE — the studio media hub on /studio (video song, music player and
 * radio sections) plus the hop into the player-queue console. The genre
 * filter / collections grid / telemetry table were retired with the media
 * hub restructure.
 *
 * /studio is opened directly: it is guarded by RequireAuth, but the
 * `chromium` project injects the shared session saved by setup/auth.setup.ts,
 * so a UI sign-in here would only add time. The full sign-in → console
 * journey is covered by SMOKE-005.
 */
test.describe('karaoke discovery', () => {
  test('KARAOKE-001: studio hub opens with video song, music player and radio', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Reason')
    await expect(page.getByRole('heading', { name: 'Video Song' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Music Player' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Radio' })).toBeVisible()
    // 4 video + 5 music + 4 radio cards.
    await expect(page.locator('main article')).toHaveCount(13)
    // Retired with the restructure.
    await expect(page.getByText('Active Stem & Track Telemetry')).toHaveCount(0)
  })

  test('KARAOKE-002: video song opens the console and auto-plays', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page).toHaveURL('/studio/player-queue')
    await expect(page.getByRole('heading', { name: 'Karaoke & Studio Audio Console' })).toBeVisible()

    // Card clicks carry autoplay: the shared bar flips to Pause and the
    // stage video actually runs (paused === false).
    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect
      .poll(() => page.locator('main video').evaluate((el) => (el as HTMLVideoElement).paused))
      .toBe(false)
  })

  test('KARAOKE-003: music player lists the minus-one sets', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByText('Viewing 5 of 5 tracks')).toBeVisible()

    const card = page.locator('main article').filter({ hasText: 'Afternoon Drive' })
    await expect(card).toContainText('Mastered by Frankie Dev')
    await expect(card).toContainText('118 BPM')
    await expect(card).toContainText('Fmaj')
    await expect(card.getByRole('button', { name: 'More options for Afternoon Drive' })).toBeVisible()
  })

  test('KARAOKE-004: sidebar session browsing highlights selection', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByRole('heading', { name: 'Catalog Stacks' })).toBeVisible()

    const defaultItem = page.getByRole('button', { name: /Master Collections Vault/ })
    const otherItem = page.getByRole('button', { name: /Stem Multitracks/ })

    // Active state is currently styling-only (no aria-pressed yet).
    await expect(defaultItem).toHaveClass(/bg-primary-soft/)
    await otherItem.click()
    await expect(otherItem).toHaveClass(/bg-primary-soft/)
    await expect(defaultItem).not.toHaveClass(/bg-primary-soft/)
  })

  test('KARAOKE-005: radio section shows on-air stations', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByText('Viewing 4 of 4 stations')).toBeVisible()
    await expect(page.getByText('On Air', { exact: true })).toHaveCount(4)

    const card = page.locator('main article').filter({ hasText: 'BTP Lounge Radio' })
    await expect(card).toContainText('OPM & Lounge')
    await expect(card).toContainText('FM 91.5')
    await expect(card.getByRole('button', { name: 'More options for BTP Lounge Radio' })).toBeVisible()
  })

  test('KARAOKE-006: shell player bar plays the local video on the console', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const video = page.locator('main video')
    await expect(video).toBeVisible() // studio skeleton → real content
    // Media metadata loaded ⇒ the transport's attach effect has run (and
    // play() will actually start). Auto-retrying — no fixed timeout.
    await expect
      .poll(() => video.evaluate((el) => (el as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(1)

    const playerBar = page.getByRole('contentinfo')
    await playerBar.getByRole('button', { name: 'Play' }).click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect(video).toHaveJSProperty('paused', false)
  })

  test('KARAOKE-007: clicking the stage toggles playback with the bar icon', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const video = page.locator('main video')
    const playerBar = page.getByRole('contentinfo')
    await expect(video).toBeVisible() // studio skeleton → real content

    // Click the stage → play; the shared bar shows the pause action/icon.
    await video.click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

    // Click again → pause; the bar flips back to the play action/icon.
    await video.click()
    await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(true)
  })

  test('KARAOKE-008: seek bar scrubs with click and drag', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const video = page.locator('main video')
    await expect(video).toBeVisible()
    // Metadata gives the transport a duration; without it seeking is a no-op.
    await expect
      .poll(() => video.evaluate((el) => (el as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(1)

    const ratio = () =>
      video.evaluate((el) => {
        const v = el as HTMLVideoElement
        return v.duration > 0 ? v.currentTime / v.duration : 0
      })

    const seek = page.getByRole('slider', { name: 'Seek' })
    const box = await seek.boundingBox()
    if (!box) throw new Error('seek bar has no bounding box')

    // Click at ~75%.
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
    await expect.poll(ratio).toBeGreaterThan(0.6)

    // Drag from ~25% to ~50%.
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 4 })
    await page.mouse.up()
    await expect.poll(ratio).toBeGreaterThan(0.35)
    await expect.poll(ratio).toBeLessThan(0.65)
  })

  test('KARAOKE-009: console back button returns to the studio hub', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    // The hub is the root of the studio flow: no back link here.
    await expect(page.getByRole('link', { name: 'Back' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page).toHaveURL('/studio/player-queue')

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByRole('heading', { level: 1, name: 'The Reason' })).toBeVisible()
  })

  test('KARAOKE-010: leaving the console hands the song to the hub, synced', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const video = page.locator('main video')
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(1.5)
    const videoTime = await video.evaluate((el) => (el as HTMLVideoElement).currentTime)

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')

    // The lobby audio picked the song up at the video's position and plays on.
    const audio = page.locator('audio')
    await expect.poll(() => audio.evaluate((el) => (el as HTMLAudioElement).paused)).toBe(false)
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
      .toBeGreaterThan(videoTime - 0.5)
    await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('KARAOKE-011: picture in picture floats across studio pages', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const video = page.locator('main video')
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(1.5)
    const videoTime = await video.evaluate((el) => (el as HTMLVideoElement).currentTime)

    // PiP button → back on the hub with the song floating in the corner.
    await page.getByRole('button', { name: 'Picture in picture' }).click()
    await expect(page).toHaveURL('/studio')
    const mini = page.getByRole('complementary', { name: 'Mini player' })
    await expect(mini).toBeVisible()
    const miniVideo = mini.locator('video')
    await expect.poll(() => miniVideo.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)
    await expect
      .poll(() => miniVideo.evaluate((el) => (el as HTMLVideoElement).currentTime))
      .toBeGreaterThan(videoTime - 0.5)

    // Hover controls pause and resume the floating player.
    await mini.hover()
    await mini.getByRole('button', { name: 'Pause' }).click()
    await expect(mini.getByRole('button', { name: 'Play' })).toBeVisible()
    await mini.getByRole('button', { name: 'Play' }).click()
    await expect(mini.getByRole('button', { name: 'Pause' })).toBeVisible()

    // Up arrow expands back into the console with the session carried over.
    await mini.getByRole('button', { name: 'Expand' }).click()
    await expect(page).toHaveURL('/studio/player-queue')
    await expect(mini).toBeHidden()
    await expect(video).toBeVisible()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)
    await expect
      .poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime))
      .toBeGreaterThan(videoTime - 0.5)
  })
})
