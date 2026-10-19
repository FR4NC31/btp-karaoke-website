import { readFileSync } from 'node:fs'
import { test, expect } from '../fixtures'
import {
  createMediaItemAsAdmin,
  deleteMediaItemAsAdmin,
  getMediaItemAsAdmin,
  uploadMediaFileAsAdmin,
} from '../helpers/media'

/**
 * The 1.35 s silence fixture, stretched by repeating its MP3 frame payload
 * (the ID3 tag stays once at the front). Skips and auto-advance assertions
 * get an 8 s clip, so a slow assertion can never race the fixture running
 * out — the tests end the song themselves when they need `ended`.
 */
function loopedSilence(repeats: number): Buffer {
  const mp3 = readFileSync(new URL('../assets/silence.mp3', import.meta.url))
  let payloadStart = 0
  if (mp3.subarray(0, 3).toString() === 'ID3') {
    const size = mp3.subarray(6, 10)
    const b0 = size[0] ?? 0
    const b1 = size[1] ?? 0
    const b2 = size[2] ?? 0
    const b3 = size[3] ?? 0
    payloadStart = 10 + ((b0 << 21) | (b1 << 14) | (b2 << 7) | b3)
  }
  const frames = mp3.subarray(payloadStart)
  return Buffer.concat([
    mp3.subarray(0, payloadStart),
    ...Array.from({ length: repeats }, () => frames),
  ])
}

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

    // The staff-only catalog panel stays off the regular user's console.
    await expect(page.getByRole('region', { name: 'Admin details' })).toHaveCount(0)
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
      lyrics: 'E2E lyric line one\nE2E lyric line two',
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

      // Nothing real to queue either: the menu explains instead of adding a
      // row the console would only skip.
      await card.getByRole('button', { name: `More options for ${title}` }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Not available for the queue')).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Add to queue' })).toHaveCount(0)
      await page.keyboard.press('Escape')

      // The row really stored the lyrics (staff read), so the public-feed
      // omission below proves the serializer, not a missing write.
      const adminRow = await getMediaItemAsAdmin(baseURL, id)
      expect(adminRow.lyrics).toBe('E2E lyric line one\nE2E lyric line two')

      // Lyrics are staff-only: the public catalog feed must not carry them.
      const publicFeed = await page.request.get('/api/media')
      expect(publicFeed.ok()).toBeTruthy()
      const publicItems = ((await publicFeed.json()) as { items: Array<Record<string, unknown>> })
        .items
      const publicRow = publicItems.find((item) => item.id === id)
      expect(publicRow).toBeTruthy()
      expect(publicRow).not.toHaveProperty('lyrics')
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

    // Repeat all keeps the floating song looping: the mini has no queue of
    // its own to wrap.
    await page.getByRole('contentinfo').getByRole('button', { name: 'Repeat off' }).click()
    await expect(
      page.getByRole('contentinfo').getByRole('button', { name: 'Repeat all' }),
    ).toBeVisible()
    await expect(miniVideo).toHaveJSProperty('loop', true)

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

  test('KARAOKE-013: a card menu queues a song for the console', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    // The seeded video card carries the hub h1; its menu is the one under test.
    const card = page.locator('main article').first()
    await card.getByRole('button', { name: 'More options for The Reason' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'The Reason' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Add to queue' }).click()
    await expect(dialog.getByRole('button', { name: 'Added to queue' })).toBeVisible()

    // Hub and console share one queue: the row shows up on the console.
    await dialog.getByRole('link', { name: 'Open lounge queue' }).click()
    await expect(page).toHaveURL('/studio/player-queue')

    const queue = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Upcoming Lounge Queue' }) })
    await expect(queue.getByRole('button', { name: 'Remove The Reason' })).toBeVisible()
  })

  test('KARAOKE-014: the bar skips play exact queued songs, never the master', { tag: '@p1' }, async ({ page, baseURL }) => {
    const stamp = Date.now()
    const first = `E2E Skip First ${stamp}`
    const second = `E2E Skip Second ${stamp}`
    const third = `E2E Skip Third ${stamp}`
    // Longer silent MP3s (see loopedSilence): the fixture's own end never
    // races the assertions — this test ends the song explicitly when needed.
    const mp3 = loopedSilence(6)
    const createdIds: string[] = []

    try {
      const one = await uploadMediaFileAsAdmin(baseURL, {
        name: 'e2e-skip-one.mp3',
        mimeType: 'audio/mpeg',
        data: mp3,
      })
      const two = await uploadMediaFileAsAdmin(baseURL, {
        name: 'e2e-skip-two.mp3',
        mimeType: 'audio/mpeg',
        data: mp3,
      })
      const three = await uploadMediaFileAsAdmin(baseURL, {
        name: 'e2e-skip-three.mp3',
        mimeType: 'audio/mpeg',
        data: mp3,
      })
      expect(one.status).toBe(201)
      expect(two.status).toBe(201)
      expect(three.status).toBe(201)
      const url1 = one.body.file!.url
      const url2 = two.body.file!.url
      const url3 = three.body.file!.url
      const { id: id1 } = await createMediaItemAsAdmin(baseURL, {
        section: 'music',
        title: first,
        tag: 'TAPE',
        sourceUrl: url1,
        sourceName: one.body.file!.name,
      })
      createdIds.push(id1)
      const { id: id2 } = await createMediaItemAsAdmin(baseURL, {
        section: 'music',
        title: second,
        tag: 'TAPE',
        sourceUrl: url2,
        sourceName: two.body.file!.name,
      })
      createdIds.push(id2)
      const { id: id3 } = await createMediaItemAsAdmin(baseURL, {
        section: 'music',
        title: third,
        tag: 'TAPE',
        sourceUrl: url3,
        sourceName: three.body.file!.name,
      })
      createdIds.push(id3)

      await page.goto('/studio')
      for (const title of [first, second, third]) {
        const card = page.locator('main article').filter({ hasText: title })
        await card.getByRole('button', { name: `More options for ${title}` }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Add to queue' }).click()
        await page.keyboard.press('Escape')
      }

      await page.goto('/studio/player-queue')
      const stage = page.locator('main video')
      const playerBar = page.getByRole('contentinfo')
      const paused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
      await expect
        .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).readyState))
        .toBeGreaterThanOrEqual(1)

      // End the current song deterministically: seek into its last fraction
      // of a second and make sure it is rolling so `ended` really fires.
      const finishSong = async () => {
        await expect
          .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).readyState))
          .toBeGreaterThanOrEqual(1)
        await stage.evaluate(async (el) => {
          const video = el as HTMLVideoElement
          video.currentTime = Math.max(0, video.duration - 0.2)
          if (video.paused) await video.play().catch(() => {})
        })
      }

      // The first Next steps over the mockup rows (nothing real behind them)
      // straight onto the first queued file, playing it — the bundled master
      // never stands in for a queued song.
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url1)
      await expect(playerBar).toContainText(first)
      await expect.poll(paused).toBe(false)

      // Song finished → the next queued file takes over and auto-plays.
      await finishSong()
      await expect(stage).toHaveAttribute('src', url2)
      await expect(playerBar).toContainText(second)
      await expect.poll(paused).toBe(false)

      // Previous walks back to the exact file; Next moves forward again.
      await playerBar.getByRole('button', { name: 'Previous' }).click()
      await expect(stage).toHaveAttribute('src', url1)
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url2)
      await expect(playerBar).toContainText(second)

      // Removing the on-air row does not swap the song under the singer: the
      // stage keeps the snapshot it was playing.
      await page.getByRole('button', { name: `Remove ${second}` }).click()
      await expect(stage).toHaveAttribute('src', url2)
      await expect(playerBar).toContainText(second)

      // Next resumes from the removed row's slot (the third song), not from
      // the top of the queue; Previous then steps back over the removed row.
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url3)
      await expect(playerBar).toContainText(third)
      await expect.poll(paused).toBe(false)
      await playerBar.getByRole('button', { name: 'Previous' }).click()
      await expect(stage).toHaveAttribute('src', url1)
    } finally {
      for (const id of createdIds) await deleteMediaItemAsAdmin(baseURL, id)
    }
  })

  test('KARAOKE-015: repeat all wraps the queue and shuffle draws random songs', { tag: '@p1' }, async ({ page, baseURL }) => {
    const stamp = Date.now()
    const first = `E2E Loop First ${stamp}`
    const second = `E2E Loop Second ${stamp}`
    const third = `E2E Loop Third ${stamp}`
    // An 8 s silent track per row: long enough that the pause/settle
    // sequences never race the clip running out between two clicks.
    const mp3 = loopedSilence(6)
    const createdIds: string[] = []

    try {
      const one = await uploadMediaFileAsAdmin(baseURL, {
        name: 'e2e-loop-one.mp3',
        mimeType: 'audio/mpeg',
        data: mp3,
      })
      const two = await uploadMediaFileAsAdmin(baseURL, {
        name: 'e2e-loop-two.mp3',
        mimeType: 'audio/mpeg',
        data: mp3,
      })
      const three = await uploadMediaFileAsAdmin(baseURL, {
        name: 'e2e-loop-three.mp3',
        mimeType: 'audio/mpeg',
        data: mp3,
      })
      expect(one.status).toBe(201)
      expect(two.status).toBe(201)
      expect(three.status).toBe(201)
      const url1 = one.body.file!.url
      const url2 = two.body.file!.url
      const url3 = three.body.file!.url
      const { id: id1 } = await createMediaItemAsAdmin(baseURL, {
        section: 'music',
        title: first,
        tag: 'TAPE',
        sourceUrl: url1,
        sourceName: one.body.file!.name,
      })
      createdIds.push(id1)
      const { id: id2 } = await createMediaItemAsAdmin(baseURL, {
        section: 'music',
        title: second,
        tag: 'TAPE',
        sourceUrl: url2,
        sourceName: two.body.file!.name,
      })
      createdIds.push(id2)
      const { id: id3 } = await createMediaItemAsAdmin(baseURL, {
        section: 'music',
        title: third,
        tag: 'TAPE',
        sourceUrl: url3,
        sourceName: three.body.file!.name,
      })
      createdIds.push(id3)

      await page.goto('/studio')
      for (const title of [first, second, third]) {
        const card = page.locator('main article').filter({ hasText: title })
        await card.getByRole('button', { name: `More options for ${title}` }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Add to queue' }).click()
        await page.keyboard.press('Escape')
      }

      await page.goto('/studio/player-queue')
      const stage = page.locator('main video')
      const playerBar = page.getByRole('contentinfo')
      const paused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
      await expect
        .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).readyState))
        .toBeGreaterThanOrEqual(1)

      // Park the stage before a check: the skip effect starts the fresh source
      // on `canplay`, which can land just after a first pause attempt.
      const settlePause = async () => {
        await expect
          .poll(async () => {
            await stage.evaluate((el) => (el as HTMLVideoElement).pause())
            return stage.evaluate((el) => (el as HTMLVideoElement).paused)
          })
          .toBe(true)
      }

      // End the current song deterministically: seek into its last fraction of
      // a second and make sure it is rolling so `ended` really fires.
      const finishSong = async () => {
        await expect
          .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).readyState))
          .toBeGreaterThanOrEqual(1)
        await stage.evaluate(async (el) => {
          const video = el as HTMLVideoElement
          video.currentTime = Math.max(0, video.duration - 0.2)
          if (video.paused) await video.play().catch(() => {})
        })
      }

      // Land on the first queued song (the mock rows are stepped over).
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url1)
      await settlePause()

      // Shuffle randomizes for real: the queue rail reorders and every Next
      // draws a random song — the round never repeats one until it has played
      // them all, then a fresh round starts without repeating the song just
      // heard (the mock rows never take part either way).
      const rail = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: 'Upcoming Lounge Queue' }) })
      const railTitles = () =>
        rail
          .locator('li')
          .evaluateAll((rows) => rows.map((row) => row.querySelector('p')?.textContent ?? ''))
      const stageSrc = () => stage.getAttribute('src')
      const drawNext = async (from: string) => {
        await playerBar.getByRole('button', { name: 'Next' }).click()
        await expect.poll(stageSrc).not.toBe(from)
        await settlePause()
        return (await stageSrc()) ?? ''
      }

      const arranged = await railTitles()
      await playerBar.getByRole('button', { name: 'Shuffle' }).click()
      await expect(playerBar.getByRole('button', { name: 'Shuffle' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      // The queue itself is now in a random order — the same rows, shuffled.
      expect([...(await railTitles())].sort()).toEqual([...arranged].sort())

      // Draw 1: a random song, never the one on air.
      let current = url1
      const draw1 = await drawNext(current)
      expect([url2, url3]).toContain(draw1)
      current = draw1
      // Draw 2: the last song the round had not played — both others are in.
      const draw2 = await drawNext(current)
      expect([draw1, draw2].sort()).toEqual([url2, url3].sort())
      current = draw2
      // Draw 3: the round is exhausted, so a fresh one starts — and it never
      // repeats the song just heard.
      const draw3 = await drawNext(current)
      expect([url1, draw1]).toContain(draw3)
      expect(draw3).not.toBe(draw2)

      // Previous walks the round's played songs back; a following Next must
      // not replay the song left behind (it stays in the round's played set).
      await playerBar.getByRole('button', { name: 'Previous' }).click()
      await expect(stage).toHaveAttribute('src', draw2)
      await settlePause()
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect.poll(stageSrc).not.toBe(draw2)
      await settlePause()
      expect(await stageSrc()).not.toBe(draw3)

      // Shuffle off: the rail goes back to the singer's arrangement.
      await playerBar.getByRole('button', { name: 'Shuffle' }).click()
      await expect(playerBar.getByRole('button', { name: 'Shuffle' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
      expect(await railTitles()).toEqual(arranged)

      // Repeat all wraps the queue at the end: walk on in order, then end the
      // second song so auto-advance wraps onto the row it started from.
      await playerBar.getByRole('button', { name: 'Repeat off' }).click()
      await expect(playerBar.getByRole('button', { name: 'Repeat all' })).toBeVisible()
      const cycle = [url1, url2, url3]
      const at = cycle.indexOf((await stageSrc()) ?? '')
      if (at === -1) throw new Error('the stage is not playing a queued song')
      const step1 = cycle[(at + 1) % cycle.length]!
      const step2 = cycle[(at + 2) % cycle.length]!
      const wrapped = cycle[at]!
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', step1)
      await settlePause()
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', step2)
      await settlePause()
      await finishSong()
      await expect(stage).toHaveAttribute('src', wrapped)
      await expect.poll(paused).toBe(false)

      // Repeat one loops the element itself; repeat off restores the queue.
      await playerBar.getByRole('button', { name: 'Repeat all' }).click()
      await expect(playerBar.getByRole('button', { name: 'Repeat one' })).toBeVisible()
      await expect(stage).toHaveJSProperty('loop', true)
      await playerBar.getByRole('button', { name: 'Repeat one' }).click()
      await expect(playerBar.getByRole('button', { name: 'Repeat off' })).toBeVisible()
      await expect(stage).toHaveJSProperty('loop', false)

      // Repeat off stops at the queue's end instead of wrapping.
      let source = (await stageSrc()) ?? ''
      for (let guard = 0; guard < cycle.length && source !== cycle[2]; guard += 1) {
        await playerBar.getByRole('button', { name: 'Next' }).click()
        await expect.poll(stageSrc).not.toBe(source)
        await settlePause()
        source = (await stageSrc()) ?? ''
      }
      await expect(stage).toHaveAttribute('src', cycle[2]!)
      await finishSong()
      await expect.poll(paused).toBe(true)
      await expect(stage).toHaveAttribute('src', cycle[2]!)
    } finally {
      for (const id of createdIds) await deleteMediaItemAsAdmin(baseURL, id)
    }
  })
})
