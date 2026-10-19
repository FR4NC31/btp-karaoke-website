import { readFileSync } from 'node:fs'
import { test, expect } from '../fixtures'
import {
  createMediaItemAsAdmin,
  deleteMediaItemAsAdmin,
  uploadMediaFileAsAdmin,
} from '../helpers/media'

/**
 * KARAOKE — the studio media hub on /studio (video song, music player and
 * radio sections) plus the hop into the player-queue console. The genre
 * filter / collections grid / telemetry table were retired with the media
 * hub restructure.
 *
 * The catalog is database-backed now, curated from /admin/media. Only the
 * one real local master ("The Reason", seeded) always exists; music and
 * radio rows are created through the admin API by the tests that assert
 * them, then deleted. Sections with no published rows render nothing, so
 * no test may assume another section's presence. Rows can carry an uploaded
 * MP4/MP3 (ADMIN-009 covers the UI uploader end to end); KARAOKE-012 proves
 * an uploaded minus-one really plays from the hub.
 *
 * /studio is opened directly: it is guarded by RequireAuth, but the
 * `chromium` project injects the shared session saved by setup/auth.setup.ts,
 * so a UI sign-in here would only add time. The full sign-in → console
 * journey is covered by SMOKE-005.
 */
test.describe('karaoke discovery', () => {
  test('KARAOKE-001: studio hub opens with the published video song', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    // The seeded local master is the first video row and carries the h1.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Reason')
    await expect(page.getByRole('heading', { name: 'Video Song' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Play The Reason' })).toBeVisible()
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

  test('KARAOKE-003: music player renders published catalog tracks', { tag: '@p1' }, async ({ page, baseURL }) => {
    const title = `E2E Minus-One ${Date.now()}`
    const { id } = await createMediaItemAsAdmin(baseURL, {
      section: 'music',
      title,
      subtitle: 'E2E session archive',
      tag: 'TAPE',
      tempo: '118 BPM',
      songKey: 'Fmaj',
    })

    try {
      await page.goto('/studio')
      await expect(page.getByRole('heading', { name: 'Music Player' })).toBeVisible()
      await expect(page.getByText(/Viewing \d+ of \d+ tracks/)).toBeVisible()

      const card = page.locator('main article').filter({ hasText: title })
      await expect(card).toContainText('E2E session archive')
      await expect(card).toContainText('118 BPM')
      await expect(card).toContainText('Fmaj')
      await expect(card.getByRole('button', { name: `More options for ${title}` })).toBeVisible()
      // No uploaded file → visual-only: no play link until audio is attached.
      await expect(card.getByRole('link', { name: `Play ${title}` })).toHaveCount(0)
    } finally {
      await deleteMediaItemAsAdmin(baseURL, id)
    }
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

  test('KARAOKE-005: radio section renders published stations', { tag: '@p2' }, async ({ page, baseURL }) => {
    const title = `E2E Station ${Date.now()}`
    const { id } = await createMediaItemAsAdmin(baseURL, {
      section: 'radio',
      title,
      subtitle: 'E2E genre',
      freq: 'FM 88.3',
      listeners: 1234,
    })

    try {
      await page.goto('/studio')
      await expect(page.getByRole('heading', { name: 'Radio' })).toBeVisible()
      await expect(page.getByText(/Viewing \d+ of \d+ stations/)).toBeVisible()

      const card = page.locator('main article').filter({ hasText: title })
      await expect(card).toContainText('E2E genre')
      await expect(card).toContainText('FM 88.3')
      await expect(card).toContainText('1.2K') // 1234 → compact form
      await expect(card).toContainText('On Air') // default tag when none is set
      await expect(card.getByRole('button', { name: `More options for ${title}` })).toBeVisible()
    } finally {
      await deleteMediaItemAsAdmin(baseURL, id)
    }
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

  test('KARAOKE-012: an uploaded minus-one really plays from the hub', { tag: '@p1' }, async ({ page, baseURL }) => {
    const title = `E2E Uploaded Track ${Date.now()}`
    // A real (silent) MP3 fixture, uploaded through the same raw-body
    // endpoint the editor uses, then attached to a fresh music row.
    const mp3 = readFileSync(new URL('../assets/silence.mp3', import.meta.url))
    const upload = await uploadMediaFileAsAdmin(baseURL, {
      name: 'e2e-minus-one.mp3',
      mimeType: 'audio/mpeg',
      data: mp3,
    })
    expect(upload.status).toBe(201)
    const sourceUrl = upload.body.file!.url
    const { id } = await createMediaItemAsAdmin(baseURL, {
      section: 'music',
      title,
      subtitle: 'E2E upload archive',
      tag: 'TAPE',
      tempo: '112 BPM',
      sourceUrl,
      sourceName: upload.body.file!.name,
    })

    try {
      await page.goto('/studio')
      const card = page.locator('main article').filter({ hasText: title })
      await expect(card).toContainText('112 BPM')

      // With audio attached the card opens the console and plays that file.
      await card.getByRole('link', { name: `Play ${title}` }).click()
      await expect(page).toHaveURL('/studio/player-queue')

      const stage = page.locator('main video')
      await expect(stage).toHaveAttribute('src', sourceUrl)
      await expect(page.getByRole('contentinfo')).toContainText(title)
      await expect.poll(() => stage.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

      // Audio mode: the stage says so and there is nothing to float in PiP.
      await expect(page.getByText('Studio Audio Mode')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Picture in picture' })).toHaveCount(0)

      // Stored media answers byte ranges — seeking an upload is real.
      const ranged = await page.request.get(sourceUrl, { headers: { Range: 'bytes=10-99' } })
      expect(ranged.status()).toBe(206)
    } finally {
      await deleteMediaItemAsAdmin(baseURL, id)
      // Deleting the row takes the stored file with it.
      const gone = await page.request.get(sourceUrl)
      expect(gone.status()).toBe(404)
    }
  })
})
