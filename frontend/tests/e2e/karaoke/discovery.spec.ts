import { readFileSync } from 'node:fs'
import { test, expect } from '../fixtures'
import {
  createMediaItemAsAdmin,
  deleteMediaItemAsAdmin,
  getMediaItemAsAdmin,
  uploadMediaFileAsAdmin,
} from '../helpers/media'

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

test.describe('karaoke discovery', () => {
  test('KARAOKE-001: studio hub opens with the published video song', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Reason')
    await expect(page.getByRole('heading', { name: 'Video Song' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Play The Reason' })).toBeVisible()
    await expect(page.getByText('Active Stem & Track Telemetry')).toHaveCount(0)
  })

  test('KARAOKE-002: video song opens the console and auto-plays', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Karaoke & Studio Audio Console' })).toBeVisible()

    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect
      .poll(() => page.locator('main video').evaluate((el) => (el as HTMLVideoElement).paused))
      .toBe(false)

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
      await expect(card.getByRole('link', { name: `Play ${title}` })).toHaveCount(0)

      await card.getByRole('button', { name: `More options for ${title}` }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Not available for the queue')).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Add to queue' })).toHaveCount(0)
      await page.keyboard.press('Escape')

      const adminRow = await getMediaItemAsAdmin(baseURL, id)
      expect(adminRow.lyrics).toBe('E2E lyric line one\nE2E lyric line two')

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
      await expect(card).toContainText('1.2K')
      await expect(card).toContainText('On Air')
      await expect(card.getByRole('button', { name: `More options for ${title}` })).toBeVisible()
    } finally {
      await deleteMediaItemAsAdmin(baseURL, id)
    }
  })

  test('KARAOKE-006: shell player bar plays the local video on the console', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const video = page.locator('main video')
    await expect(video).toBeVisible()
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
    await expect(video).toBeVisible()

    await video.click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

    await video.click()
    await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(true)
  })

  test('KARAOKE-008: seek bar scrubs with click and drag', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/player-queue')
    const video = page.locator('main video')
    await expect(video).toBeVisible()
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

    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
    await expect.poll(ratio).toBeGreaterThan(0.6)

    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 4 })
    await page.mouse.up()
    await expect.poll(ratio).toBeGreaterThan(0.35)
    await expect.poll(ratio).toBeLessThan(0.65)
  })

  test('KARAOKE-009: console back button returns to the studio hub', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByRole('link', { name: 'Back' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByRole('heading', { level: 1, name: 'The Reason' })).toBeVisible()
  })

  test('KARAOKE-010: leaving the console keeps the same song playing on the hub', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const video = page.locator('main video')
    const videoTime = () => video.evaluate((el) => (el as HTMLVideoElement).currentTime)
    const videoPaused = () => video.evaluate((el) => (el as HTMLVideoElement).paused)
    await expect.poll(videoTime).toBeGreaterThan(1.5)
    const beforeLeaving = await videoTime()

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')

    await expect(video).toBeHidden()
    await expect(page.locator('audio')).toHaveCount(0)
    await expect.poll(videoPaused).toBe(false)
    await expect.poll(videoTime).toBeGreaterThan(beforeLeaving + 0.2)
    await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Pause' })).toBeVisible()
  })

  test('KARAOKE-011: picture in picture floats across studio pages', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const video = page.locator('main video')
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(1.5)
    const videoTime = await video.evaluate((el) => (el as HTMLVideoElement).currentTime)

    await page.getByRole('button', { name: 'Picture in picture' }).click()
    await expect(page).toHaveURL('/studio')
    const mini = page.getByRole('complementary', { name: 'Mini player' })
    await expect(mini).toBeVisible()
    const miniVideo = mini.locator('video')
    await expect.poll(() => miniVideo.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)
    await expect
      .poll(() => miniVideo.evaluate((el) => (el as HTMLVideoElement).currentTime))
      .toBeGreaterThan(videoTime - 0.5)

    await mini.hover()
    await mini.getByRole('button', { name: 'Pause', exact: true }).click()
    await expect(mini.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
    await mini.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(mini.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()

    await mini.getByRole('button', { name: 'Expand' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(mini).toBeHidden()
    await expect(video).toBeVisible()
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)
    await expect
      .poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime))
      .toBeGreaterThan(videoTime - 0.5)
  })

  test('KARAOKE-012: an uploaded minus-one really plays from the hub', { tag: '@p1' }, async ({ page, baseURL }) => {
    const title = `E2E Uploaded Track ${Date.now()}`
    // One second is too short: the song can legitimately end while the test
    // checks playback state and navigates back to the hub.
    const mp3 = loopedSilence(6)
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

      await card.getByRole('link', { name: `Play ${title}` }).click()
      await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()

      const stage = page.locator('main video')
      await expect(stage).toHaveAttribute('src', sourceUrl)
      await expect(page.getByRole('contentinfo')).toContainText(title)
      await expect.poll(() => stage.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

      await expect(page.getByText('Studio Audio Mode')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Picture in picture' })).toHaveCount(0)

      const ranged = await page.request.get(sourceUrl, { headers: { Range: 'bytes=10-99' } })
      expect(ranged.status()).toBe(206)
      const beforeLeaving = await stage.evaluate((el) => (el as HTMLVideoElement).currentTime)

      await page.getByRole('link', { name: 'Back' }).click()
      await expect(page).toHaveURL('/studio')
      const playerBar = page.getByRole('contentinfo')
      await expect(playerBar).toContainText(title)
      await expect(playerBar).toContainText('Studio master · MP3')
      await expect(stage).toHaveAttribute('src', sourceUrl)
      await expect(stage).toBeHidden()
      await expect.poll(() => stage.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)
      await expect
        .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).currentTime))
        .toBeGreaterThan(beforeLeaving + 0.2)
      await expect(page.locator('audio')).toHaveCount(0)
    } finally {
      await deleteMediaItemAsAdmin(baseURL, id)
      const gone = await page.request.get(sourceUrl)
      expect(gone.status()).toBe(404)
    }
  })

  test('KARAOKE-013: a card menu queues a song for the console', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    const card = page.locator('main article').first()
    const optionsButton = card.getByRole('button', { name: 'More options for The Reason' })
    await expect(optionsButton).toHaveAttribute('aria-haspopup', 'dialog')
    await optionsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'The Reason' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Add to Your Library' })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Go to artist radio' })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Add to playlist' })).toBeEnabled()
    await expect(dialog.getByRole('button', { name: 'Share' })).toBeDisabled()
    await dialog.getByRole('button', { name: 'Add to queue' }).click()
    await expect(dialog.getByRole('button', { name: 'Added to queue' })).toBeVisible()

    await dialog.getByRole('link', { name: 'Open lounge queue' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()

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
        const dialog = page.getByRole('dialog', { name: title })
        await card.getByRole('button', { name: `More options for ${title}` }).click()
        await dialog.getByRole('button', { name: 'Add to queue' }).click()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }

      await page.goto('/studio/player-queue')
      const stage = page.locator('main video')
      const playerBar = page.getByRole('contentinfo')
      const paused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
      await expect
        .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).readyState))
        .toBeGreaterThanOrEqual(1)

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

      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url1)
      await expect(playerBar).toContainText(first)
      await expect.poll(paused).toBe(false)

      await finishSong()
      await expect(stage).toHaveAttribute('src', url2)
      await expect(playerBar).toContainText(second)
      await expect.poll(paused).toBe(false)

      await playerBar.getByRole('button', { name: 'Previous' }).click()
      await expect(stage).toHaveAttribute('src', url1)
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url2)
      await expect(playerBar).toContainText(second)

      await page.getByRole('button', { name: `Remove ${second}` }).click()
      await expect(stage).toHaveAttribute('src', url2)
      await expect(playerBar).toContainText(second)

      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url3)
      await expect(playerBar).toContainText(third)
      await expect.poll(paused).toBe(false)
      await playerBar.getByRole('button', { name: 'Previous' }).click()
      await expect(stage).toHaveAttribute('src', url1)

      // The same transport must be able to load the next file while the console
      // is minimized and the hidden element is using preload="none".
      await page.getByRole('link', { name: 'Back' }).click()
      await expect(page).toHaveURL('/studio')
      await expect(stage).toBeHidden()
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url3)
      await expect(playerBar).toContainText(third)
      await expect.poll(paused).toBe(false)
    } finally {
      for (const id of createdIds) await deleteMediaItemAsAdmin(baseURL, id)
    }
  })

  test('KARAOKE-015: repeat all wraps the queue and shuffle draws random songs', { tag: '@p1' }, async ({ page, baseURL }) => {
    const stamp = Date.now()
    const first = `E2E Loop First ${stamp}`
    const second = `E2E Loop Second ${stamp}`
    const third = `E2E Loop Third ${stamp}`
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
        const dialog = page.getByRole('dialog', { name: title })
        await card.getByRole('button', { name: `More options for ${title}` }).click()
        await dialog.getByRole('button', { name: 'Add to queue' }).click()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }

      await page.goto('/studio/player-queue')
      const stage = page.locator('main video')
      const playerBar = page.getByRole('contentinfo')
      const paused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
      await expect
        .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).readyState))
        .toBeGreaterThanOrEqual(1)

      const settlePause = async () => {
        await expect
          .poll(async () => {
            await stage.evaluate((el) => (el as HTMLVideoElement).pause())
            return stage.evaluate((el) => (el as HTMLVideoElement).paused)
          })
          .toBe(true)
      }

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

      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect(stage).toHaveAttribute('src', url1)
      await settlePause()

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
      expect([...(await railTitles())].sort()).toEqual([...arranged].sort())

      let current = url1
      const draw1 = await drawNext(current)
      expect([url2, url3]).toContain(draw1)
      current = draw1
      const draw2 = await drawNext(current)
      expect([draw1, draw2].sort()).toEqual([url2, url3].sort())
      current = draw2
      const draw3 = await drawNext(current)
      expect([url1, draw1]).toContain(draw3)
      expect(draw3).not.toBe(draw2)

      await playerBar.getByRole('button', { name: 'Previous' }).click()
      await expect(stage).toHaveAttribute('src', draw2)
      await settlePause()
      await playerBar.getByRole('button', { name: 'Next' }).click()
      await expect.poll(stageSrc).not.toBe(draw2)
      await settlePause()
      expect(await stageSrc()).not.toBe(draw3)

      await playerBar.getByRole('button', { name: 'Shuffle' }).click()
      await expect(playerBar.getByRole('button', { name: 'Shuffle' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
      expect(await railTitles()).toEqual(arranged)

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

      await playerBar.getByRole('button', { name: 'Repeat all' }).click()
      await expect(playerBar.getByRole('button', { name: 'Repeat one' })).toBeVisible()
      await expect(stage).toHaveJSProperty('loop', true)
      await playerBar.getByRole('button', { name: 'Repeat one' }).click()
      await expect(playerBar.getByRole('button', { name: 'Repeat off' })).toBeVisible()
      await expect(stage).toHaveJSProperty('loop', false)

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

  test('KARAOKE-016: player queue opens from the studio navigation and player bar', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    const topBar = page.getByRole('banner')
    await topBar.getByRole('link', { name: 'Player Queue' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Karaoke & Studio Audio Console' }),
    ).toBeVisible()
    await expect(topBar.getByRole('link', { name: /Player Queue/i })).toHaveClass(/bg-primary-soft/)

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByRole('heading', { level: 1, name: 'The Reason' })).toBeVisible()

    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')

    const playerBar = page.getByRole('contentinfo')
    await playerBar.getByRole('button', { name: /Play|Pause/ }).click()
    await expect(page).toHaveURL('/studio')

    await page.getByRole('slider', { name: 'Seek' }).click()
    await expect(page).toHaveURL('/studio')

    await playerBar.getByRole('link', { name: /Open player queue/ }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()

    await playerBar.getByRole('link', { name: /Minimize player queue/i }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeHidden()
    const emptyBarSpot = await playerBar.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return document.elementFromPoint(rect.left + 4, rect.top + 72) === el
    })
    expect(emptyBarSpot).toBe(true)
    await playerBar.click({ position: { x: 4, y: 72 } })
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
  })

  test('KARAOKE-017: reopening the queue resumes playback and toggles back', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const stage = page.locator('main video')
    const stageTime = () => stage.evaluate((el) => (el as HTMLVideoElement).currentTime)
    const stagePaused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
    await expect.poll(stageTime).toBeGreaterThan(1.5)
    const beforeMinimize = await stageTime()
    const stageSource = await stage.getAttribute('src')
    expect(stageSource).toBeTruthy()

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(stage).toBeHidden()
    await expect.poll(stageTime).toBeGreaterThan(beforeMinimize + 0.2)
    await expect.poll(stagePaused).toBe(false)
    await expect(page.locator('audio')).toHaveCount(0)

    const topBar = page.getByRole('banner')
    const playerBar = page.getByRole('contentinfo')

    async function expectQueueResume(openQueue: () => Promise<void>) {
      const videoBefore = await stageTime()
      await openQueue()
      await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
      await expect(stage).toHaveAttribute('src', stageSource ?? '')
      await expect(stage).toBeVisible()
      await expect.poll(stageTime).toBeGreaterThan(videoBefore - 0.5)
      await expect.poll(stagePaused).toBe(false)
      return stageTime()
    }

    async function expectQueueMinimized(videoBefore: number) {
      await expect(page.locator('[data-player-mode="expanded"]')).toBeHidden()
      await expect(stage).toBeHidden()
      await expect.poll(stageTime).toBeGreaterThan(videoBefore - 0.5)
      await expect.poll(stagePaused).toBe(false)
    }

    const fromTopBar = await expectQueueResume(() =>
      topBar.getByRole('link', { name: 'Player Queue' }).click(),
    )
    await expect(topBar.getByRole('link', { name: /Minimize player queue/i })).toHaveAttribute(
      'href',
      '/studio',
    )
    await topBar.getByRole('link', { name: /Minimize player queue/i }).click()
    await expectQueueMinimized(fromTopBar)

    const fromPlayerBar = await expectQueueResume(() =>
      playerBar.getByRole('link', { name: /Open player queue/i }).click(),
    )
    await expect(playerBar.getByRole('link', { name: /Minimize player queue/i })).toBeVisible()
    await playerBar.getByRole('link', { name: /Minimize player queue/i }).click()
    await expectQueueMinimized(fromPlayerBar)
  })

  test('KARAOKE-018: playback survives browsing other studio pages', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const stage = page.locator('main video')
    const stageTime = () => stage.evaluate((el) => (el as HTMLVideoElement).currentTime)
    const stagePaused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
    await expect.poll(stageTime).toBeGreaterThan(1.5)
    const beforeBrowsing = await stageTime()

    const topBar = page.getByRole('banner')
    await topBar.getByRole('link', { name: 'Bookings' }).click()
    await expect(page).toHaveURL('/studio/bookings')
    await expect(page.getByRole('heading', { level: 1, name: 'Booking Desk' })).toBeVisible()

    const playerBar = page.getByRole('contentinfo')
    await expect(playerBar).toContainText('The Reason')
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect(stage).toBeHidden()
    await expect.poll(stagePaused).toBe(false)
    await expect.poll(stageTime).toBeGreaterThan(beforeBrowsing + 0.2)

    await topBar.getByRole('link', { name: 'Player Queue' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(stage).toBeVisible()
    await expect.poll(stagePaused).toBe(false)
    await expect.poll(stageTime).toBeGreaterThan(beforeBrowsing + 0.2)
  })

  test('KARAOKE-019: closing the mini player keeps the song in the bar', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const stage = page.locator('main video')
    const stagePaused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
    await expect
      .poll(() => stage.evaluate((el) => (el as HTMLVideoElement).currentTime))
      .toBeGreaterThan(1.5)

    await page.getByRole('button', { name: 'Picture in picture' }).click()
    const mini = page.getByRole('complementary', { name: 'Mini player' })
    await expect(mini).toBeVisible()
    await expect.poll(() => mini.locator('video').evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

    await mini.getByRole('button', { name: 'Close mini player' }).click()
    await expect(mini).toBeHidden()
    await expect(stage).toBeHidden()
    await expect.poll(stagePaused).toBe(false)
    await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Pause' })).toBeVisible()

    await page.getByRole('contentinfo').getByRole('link', { name: /Open player queue/ }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(stage).toBeVisible()
    await expect.poll(stagePaused).toBe(false)
  })

  test('KARAOKE-020: opening the queue while paused stays paused and does not restart', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const stage = page.locator('main video')
    const stageTime = () => stage.evaluate((el) => (el as HTMLVideoElement).currentTime)
    const stagePaused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
    const playerBar = page.getByRole('contentinfo')
    await expect.poll(stageTime).toBeGreaterThan(1.5)

    await playerBar.getByRole('button', { name: 'Pause' }).click()
    await expect.poll(stagePaused).toBe(true)
    const pausedAt = await stageTime()

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(stage).toBeHidden()
    await expect.poll(stagePaused).toBe(true)

    await page.getByRole('banner').getByRole('link', { name: 'Player Queue' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(stage).toBeVisible()
    await expect.poll(stagePaused).toBe(true)
    await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
    expect(Math.abs((await stageTime()) - pausedAt)).toBeLessThan(0.25)
  })

  test('KARAOKE-021: replaying the same card restarts the persistent player', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()

    const stage = page.locator('main video')
    const stageTime = () => stage.evaluate((el) => (el as HTMLVideoElement).currentTime)
    const stagePaused = () => stage.evaluate((el) => (el as HTMLVideoElement).paused)
    await expect.poll(stageTime).toBeGreaterThan(1.5)

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(stage).toBeHidden()

    // The same src stays loaded on the persistent element, so selecting the
    // card again must reset the playhead explicitly.
    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page.locator('[data-player-mode="expanded"]')).toBeVisible()
    await expect(stage).toBeVisible()
    await expect.poll(stageTime).toBeLessThan(1)
    await expect.poll(stagePaused).toBe(false)
  })

  test('KARAOKE-022: the studio logo returns to the hub', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/playlists')
    const logo = page.getByRole('banner').getByRole('link', { name: 'Studio home' })
    await expect(logo).toBeVisible()
    await logo.click()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByRole('heading', { level: 1, name: 'The Reason' })).toBeVisible()
  })
})
