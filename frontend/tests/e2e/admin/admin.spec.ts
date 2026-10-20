import { request as rawRequest } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import {
  ADMIN_STORAGE_STATE,
  ANONYMOUS,
  TEST_USER,
  signInAsAdmin,
} from '../helpers/auth'
import { createMediaItemAsAdmin, deleteMediaItemAsAdmin, uploadMediaFileAsAdmin } from '../helpers/media'


function farFutureDay(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 400 + Math.floor(Math.random() * 300))
  return d.toISOString().slice(0, 10)
}

function topBar(page: Page) {
  return page.getByRole('banner')
}

function pendingQueue(page: Page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'Pending approvals' }) })
}

function reservationRow(page: Page, reference: string) {
  return page.locator('main li').filter({ hasText: reference })
}

function flashWith(page: Page, text: string) {
  return page.getByRole('status').filter({ hasText: text })
}

function referenceFrom(text: string): string {
  const reference = text.match(/BTP-[A-Z2-9]{6}/)?.[0]
  expect(reference, 'the flash should carry a BTP reference code').toBeTruthy()
  return reference!
}

async function serviceIdByCode(api: APIRequestContext, code: string): Promise<string> {
  const response = await api.get('/api/services')
  const body = await response.json()
  const match = body.services.find((service: { code: string }) => service.code === code)
  expect(match, `service ${code} should be seeded`).toBeTruthy()
  return match.id
}

async function createPendingAsCustomer(
  baseURL: string | undefined,
  serviceCode: string,
): Promise<{ id: string; referenceCode: string }> {
  const context = await rawRequest.newContext({ baseURL })
  try {
    const signIn = await context.post('/api/auth/sign-in/email', {
      headers: { Origin: baseURL ?? '' },
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })
    expect(signIn.ok()).toBeTruthy()

    const serviceId = await serviceIdByCode(context, serviceCode)
    const created = await context.post('/api/bookings', {
      data: { serviceId, bookingDate: farFutureDay(), notes: 'E2E admin queue probe' },
    })
    expect(created.ok()).toBeTruthy()
    const body = await created.json()
    return { id: body.booking.id, referenceCode: body.booking.referenceCode }
  } finally {
    await context.dispose()
  }
}

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('admin sign-in', () => {
  test.use({ storageState: ANONYMOUS })

  test('ADMIN-001: signing in lands an admin on the console', { tag: '@p1' }, async ({ page }) => {
    await signInAsAdmin(page)

    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pending approvals' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Today at the studio' })).toBeVisible()
  })
})

test.describe('reservation queue', () => {
  test('ADMIN-002: a pending reservation is confirmed from the queue, then completed', { tag: '@p1' }, async ({ page, baseURL }) => {
    const { referenceCode } = await createPendingAsCustomer(baseURL, 'STUDIO-TRACKING')

    await page.goto('/admin')
    const row = pendingQueue(page).locator('li').filter({ hasText: referenceCode })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Confirm' }).click()
    await expect(flashWith(page, `${referenceCode} confirmed`)).toBeVisible()
    await expect(row).toBeHidden()

    await page.goto('/admin/bookings')
    await page.getByLabel('Search').fill(referenceCode)
    await page.getByRole('button', { name: 'Search' }).click()

    const listed = reservationRow(page, referenceCode)
    await expect(listed).toContainText('confirmed')
    await listed.getByRole('button', { name: 'Mark completed' }).click()
    await expect(flashWith(page, `${referenceCode} is now completed.`)).toBeVisible()
    await expect(listed).toContainText('completed')
  })

  test('ADMIN-003: a pending reservation is rejected from the queue', { tag: '@p1' }, async ({ page, baseURL }) => {
    const { referenceCode } = await createPendingAsCustomer(baseURL, 'RADIO-ONLINE')

    await page.goto('/admin')
    const row = pendingQueue(page).locator('li').filter({ hasText: referenceCode })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Reject' }).click()
    await expect(flashWith(page, `${referenceCode} rejected`)).toBeVisible()
    await expect(row).toBeHidden()

    await page.goto('/admin/bookings')
    await page.getByLabel('Search').fill(referenceCode)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(reservationRow(page, referenceCode)).toContainText('rejected')
  })
})

test.describe('booking for others', () => {
  test('ADMIN-004: the admin books a day for a guest name', { tag: '@p1' }, async ({ page, request }) => {
    const guestName = `E2E Guest ${Date.now()}`
    const serviceId = await serviceIdByCode(request, 'CUT-MASTERING')

    await page.goto('/admin')
    await page.getByRole('button', { name: '+ New reservation' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'New reservation' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Guest name' }).click()
    await dialog.getByLabel('Guest name').fill(guestName)
    await dialog.getByLabel('Service').selectOption(serviceId)
    await dialog.getByLabel('Session date').fill(farFutureDay())
    await dialog.getByRole('button', { name: 'Save reservation' }).click()

    const flash = flashWith(page, 'reference')
    await expect(flash).toBeVisible()
    const referenceCode = referenceFrom(await flash.innerText())
    await expect(flash).toContainText('confirmed')
    await expect(flash).toContainText(guestName)

    await page.getByRole('link', { name: 'View reservations' }).click()
    await expect(page).toHaveURL('/admin/bookings')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByLabel('Search').fill(referenceCode)
    await page.getByRole('button', { name: 'Search' }).click()

    const listed = reservationRow(page, referenceCode)
    await expect(listed).toContainText('confirmed')
    await expect(listed).toContainText('Guest')
    await expect(listed).toContainText(guestName)

    await listed.getByRole('button', { name: 'Cancel' }).click()
    await expect(flashWith(page, `${referenceCode} is now cancelled.`)).toBeVisible()
    await expect(listed).toContainText('cancelled')
  })

  test('ADMIN-005: the admin tags a registered customer instead of a guest', { tag: '@p1' }, async ({ page, request }) => {
    const serviceId = await serviceIdByCode(request, 'FILSCAP-PORTAL')

    await page.goto('/admin/bookings')
    await page.getByRole('button', { name: '+ New reservation' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'New reservation' })).toBeVisible()

    await dialog.getByLabel('Find an account').fill(TEST_USER.email)
    await dialog.getByRole('button').filter({ hasText: TEST_USER.email }).click()
    await dialog.getByLabel('Service').selectOption(serviceId)
    await dialog.getByLabel('Session date').fill(farFutureDay())
    await dialog.getByRole('button', { name: 'Save reservation' }).click()

    const flash = flashWith(page, 'reference')
    await expect(flash).toBeVisible()
    const referenceCode = referenceFrom(await flash.innerText())
    await expect(flash).toContainText('confirmed')

    await page.getByRole('link', { name: 'View reservations' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByLabel('Search').fill(referenceCode)
    await page.getByRole('button', { name: 'Search' }).click()

    const listed = reservationRow(page, referenceCode)
    await expect(listed).toContainText('confirmed')
    await expect(listed).toContainText(TEST_USER.email)
    await expect(listed).not.toContainText('Guest')

    await listed.getByRole('button', { name: 'Mark completed' }).click()
    await expect(flashWith(page, `${referenceCode} is now completed.`)).toBeVisible()
    await expect(listed).toContainText('completed')
  })
})

test.describe('console entry points', () => {
  test('ADMIN-006: the studio chrome exposes the console link, and it works', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')

    const consoleLink = topBar(page).getByRole('link', { name: 'Admin Console' })
    await expect(consoleLink).toBeVisible()
    await consoleLink.click()

    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
  })

  test('ADMIN-011: a signed-in admin is never dropped into the user dashboard', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signin')
    await expect(page).toHaveURL('/admin')
    await page.goto('/signup')
    await expect(page).toHaveURL('/admin')

    await page.goto('/')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('media hub catalog', () => {
  test('ADMIN-007: the admin adds a music track and it reaches the hub', { tag: '@p1' }, async ({ page }) => {
    const title = `E2E Session ${Date.now()}`

    await page.goto('/admin/media/new')
    await expect(page.getByLabel('Lyrics')).toHaveCount(0)
    await page.getByLabel('Type').selectOption('music')
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Description').fill('E2E mixdown notes')
    await page.getByLabel('Tempo').fill('120 BPM')
    await page.getByLabel('Key', { exact: true }).fill('Am')
    const lyricsText = 'E2E lyric line one\nE2E lyric line two'
    await page.getByLabel('Lyrics').fill(lyricsText)
    await page.getByRole('button', { name: 'Add to the hub' }).click()

    const flash = flashWith(page, title)
    await expect(flash).toBeVisible()
    await expect(flash).toContainText('live on the hub')

    await page.goto('/admin/media')
    const row = page.locator('main li').filter({ hasText: title })
    await expect(row).toContainText('Live')
    await expect(row).toContainText('120 BPM')
    await expect(row).toContainText('Key Am')

    await page.goto('/studio')
    const card = page.locator('main article').filter({ hasText: title })
    await expect(card).toContainText('E2E mixdown notes')
    await expect(card).toContainText('120 BPM')

    const listed = await page.request.get('/api/admin/media')
    const items = (await listed.json()).items as Array<{ title: string; lyrics: string | null }>
    expect(items.find((entry) => entry.title === title)?.lyrics).toBe(lyricsText)

    await page.goto('/admin/media')
    const cleanup = page.locator('main li').filter({ hasText: title })
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await expect(cleanup.getByRole('button', { name: `Confirm delete ${title}` })).toBeVisible()
    await cleanup.getByRole('button', { name: `Cancel delete ${title}` }).click()
    await expect(cleanup).toContainText('Live')
    await expect(cleanup.getByRole('button', { name: `Confirm delete ${title}` })).toHaveCount(0)
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await cleanup.getByRole('button', { name: `Confirm delete ${title}` }).click()
    await expect(flashWith(page, `${title} removed.`)).toBeVisible()
    await expect(cleanup).toBeHidden()
  })

  test('ADMIN-008: media rows can be hidden, reordered, and edited', { tag: '@p2' }, async ({ page, baseURL }) => {
    const stamp = Date.now()
    const alpha = `E2E Alpha ${stamp}`
    const beta = `E2E Beta ${stamp}`
    const alphaItem = await createMediaItemAsAdmin(baseURL, { section: 'video', title: alpha, tag: 'DUET' })
    const betaItem = await createMediaItemAsAdmin(baseURL, { section: 'video', title: beta, tag: 'POP' })

    const rowIndexOf = async (needle: string) => {
      const texts = await page.locator('main li').allTextContents()
      return texts.findIndex((text) => text.includes(needle))
    }

    try {
      await page.goto('/admin/media')
      const betaRow = page.locator('main li').filter({ hasText: beta })
      await expect(betaRow).toContainText('Live')

      await betaRow.getByRole('button', { name: `Hide ${beta}` }).click()
      await expect(flashWith(page, `${beta} is now hidden.`)).toBeVisible()
      await expect(betaRow).toContainText('Hidden')

      await page.goto('/studio')
      await expect(page.locator('main article').filter({ hasText: alpha })).toBeVisible()
      await expect(page.locator('main article').filter({ hasText: beta })).toHaveCount(0)

      await page.goto('/admin/media')
      const shownRow = page.locator('main li').filter({ hasText: beta })
      await shownRow.getByRole('button', { name: `Show ${beta}` }).click()
      await expect(flashWith(page, `${beta} is now live.`)).toBeVisible()
      await expect(shownRow).toContainText('Live')

      const before = await rowIndexOf(beta)
      await shownRow.getByRole('button', { name: `Move ${beta} earlier` }).click()
      await expect(flashWith(page, `${beta} moved earlier.`)).toBeVisible()
      await expect.poll(() => rowIndexOf(beta)).toBeLessThan(before)

      await page.locator('main li').filter({ hasText: beta }).getByRole('link', { name: `Edit ${beta}` }).click()
      await expect(page).toHaveURL(/\/admin\/media\//)
      await expect(page.getByLabel('Title', { exact: true })).toHaveValue(beta)
      await page.getByLabel('Title', { exact: true }).fill(`${beta} v2`)
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(flashWith(page, 'Saved')).toBeVisible()

      await page.goto('/admin/media')
      await expect(page.locator('main li').filter({ hasText: `${beta} v2` })).toContainText('Live')
    } finally {
      await deleteMediaItemAsAdmin(baseURL, alphaItem.id)
      await deleteMediaItemAsAdmin(baseURL, betaItem.id)
    }
  })

  test('ADMIN-009: the admin uploads an MP4 and the hub really plays it', { tag: '@p1' }, async ({ page }) => {
    const title = `E2E Upload ${Date.now()}`

    await page.goto('/admin/media/new')
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Artist').fill('E2E performer')
    await page.getByLabel('Video file (MP4)').setInputFiles('src/assets/video_local/the-reason.mp4')
    await expect(page.getByText(/Ready to upload: the-reason\.mp4/)).toBeVisible()
    await expect(page.getByText('Runtime: 3:54 — read from the file.')).toBeVisible()

    await page.getByRole('button', { name: 'Add to the hub' }).click()
    await expect(flashWith(page, title)).toContainText('live on the hub')

    await page.goto('/admin/media')
    const row = page.locator('main li').filter({ hasText: title })
    await expect(row).toContainText('MP4 file')

    await page.goto('/studio')
    const card = page.locator('main article').filter({ hasText: title })
    await expect(card).toContainText('E2E performer')
    await expect(card).toContainText('3:54')
    await page.getByRole('link', { name: `Play ${title}` }).click()
    await expect(page).toHaveURL('/studio/player-queue')

    const video = page.locator('main video')
    const src = await video.getAttribute('src')
    expect(src, 'the stage should point at the stored upload').toContain('/api/uploads/media/')
    await expect(page.getByRole('contentinfo')).toContainText(title)
    await expect(page.getByRole('contentinfo')).toContainText('E2E performer')
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

    const ranged = await page.request.get(src!, { headers: { Range: 'bytes=0-99' } })
    expect(ranged.status()).toBe(206)
    expect(ranged.headers()['content-range']).toMatch(/^bytes 0-99\/\d+$/)

    await page.goto('/admin/media')
    const cleanup = page.locator('main li').filter({ hasText: title })
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await cleanup.getByRole('button', { name: `Confirm delete ${title}` }).click()
    await expect(flashWith(page, `${title} removed.`)).toBeVisible()
    await expect(cleanup).toBeHidden()

    const gone = await page.request.get(src!)
    expect(gone.status(), 'the uploaded file should be deleted with its row').toBe(404)
  })

  test('ADMIN-010: the uploader rejects files that are not real media or cover images', { tag: '@p2' }, async ({ request, baseURL }) => {
    const text = await uploadMediaFileAsAdmin(baseURL, {
      name: 'notes.txt',
      mimeType: 'text/plain',
      data: 'definitely not media',
    })
    expect(text.status).toBe(400)
    expect(text.body.error).toBe(
      'Only MP4 video, MP3 audio or JPG/PNG/WebP image files can be uploaded.',
    )

    const mismatch = await uploadMediaFileAsAdmin(baseURL, {
      name: 'track.mp3',
      mimeType: 'video/mp4',
      data: 'definitely not media',
    })
    expect(mismatch.status).toBe(400)
    expect(mismatch.body.error).toContain('does not match')

    const imageMismatch = await uploadMediaFileAsAdmin(baseURL, {
      name: 'cover.png',
      mimeType: 'video/mp4',
      data: 'definitely not an image',
    })
    expect(imageMismatch.status).toBe(400)
    expect(imageMismatch.body.error).toContain('does not match')

    const badSource = await request.post('/api/admin/media', {
      data: {
        section: 'video',
        title: `E2E bad source ${Date.now()}`,
        sourceUrl: '/api/uploads/media/probe.png',
      },
    })
    expect(badSource.status()).toBe(400)
    expect((await badSource.json()).error).toContain('source file')

    const badCover = await request.post('/api/admin/media', {
      data: {
        section: 'music',
        title: `E2E bad cover ${Date.now()}`,
        coverUrl: '/api/uploads/media/probe.mp4',
      },
    })
    expect(badCover.status()).toBe(400)
    expect((await badCover.json()).error).toContain('cover image')

    const anonymous = await rawRequest.newContext({ baseURL, storageState: ANONYMOUS })
    try {
      const response = await anonymous.post('/api/admin/media/upload', {
        headers: { 'Content-Type': 'audio/mpeg', 'X-File-Name': 'x.mp3' },
        data: 'x',
      })
      expect(response.status()).toBe(401)
    } finally {
      await anonymous.dispose()
    }
  })

  test('ADMIN-012: MP3 tags fill the editor and the embedded cover reaches the hub', { tag: '@p1' }, async ({ page }) => {
    const title = `E2E Tagged ${Date.now()}`

    await page.goto('/admin/media/new')
    await page.getByLabel('Type').selectOption('music')
    await page.getByLabel('Audio file (MP3)').setInputFiles('tests/e2e/assets/silence.mp3')
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('1 Second of Silence')

    await page.getByLabel('Title', { exact: true }).fill(title)
    await expect(page.getByLabel('Artist')).toHaveValue('Anar Software LLC')
    await expect(page.getByLabel('Description')).toHaveValue('')
    await expect(page.getByLabel('Album')).toHaveValue('Blank Audio')
    await expect(page.getByText('Runtime: 0:01 — read from the file.')).toBeVisible()

    await expect(page.getByText("Found in the file's own tags")).toBeVisible()
    await expect(page.getByAltText('Cover preview')).toHaveAttribute('src', /^blob:/)

    await page.getByRole('button', { name: 'Add to the hub' }).click()
    await expect(flashWith(page, title)).toContainText('live on the hub')

    const listed = await page.request.get('/api/admin/media')
    const items = (await listed.json()).items as Array<{
      title: string
      artist: string | null
      duration: string | null
      sourceUrl: string | null
      coverUrl: string | null
    }>
    const stored = items.find((entry) => entry.title === title)
    expect(stored?.artist, 'the artist tag should be stored on the row').toBe('Anar Software LLC')
    expect(stored?.duration, 'the runtime should be read off the MP3').toBe('0:01')
    expect(stored?.sourceUrl, 'the MP3 should be attached').toContain('/api/uploads/media/')
    expect(stored?.coverUrl, 'the embedded art should be attached').toMatch(
      /\/api\/uploads\/media\/.+\.webp$/,
    )

    await page.goto('/admin/media')
    const row = page.locator('main li').filter({ hasText: title })
    await expect(row).toContainText('MP3 file')
    await expect(row).toContainText('Cover')

    await page.goto('/studio')
    const card = page.locator('main article').filter({ hasText: title })
    const cover = card.locator('img')
    await expect(cover).toBeVisible()
    expect(await cover.getAttribute('src')).toBe(stored!.coverUrl)
    await expect(card).toContainText('Anar Software LLC')
    await expect(card).toContainText('0:01')
    await expect(card).toContainText('Blank Audio')

    const served = await page.request.get(stored!.coverUrl!)
    expect(served.status()).toBe(200)
    expect(served.headers()['content-type']).toContain('image/webp')

    await page.goto('/admin/media')
    const cleanup = page.locator('main li').filter({ hasText: title })
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await cleanup.getByRole('button', { name: `Confirm delete ${title}` }).click()
    await expect(flashWith(page, `${title} removed.`)).toBeVisible()

    expect((await page.request.get(stored!.sourceUrl!)).status()).toBe(404)
    expect((await page.request.get(stored!.coverUrl!)).status()).toBe(404)
  })

  test('ADMIN-013: a video thumbnail is grabbed, overridden, removed, and defaulted', { tag: '@p1' }, async ({ page }) => {
    const title = `E2E Thumb ${Date.now()}`

    await page.goto('/admin/media/new')
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Video file (MP4)').setInputFiles('src/assets/video_local/the-reason.mp4')
    await expect(page.getByText(/Ready to upload: the-reason\.mp4/)).toBeVisible()

    await expect(page.getByText('Grabbed from the video')).toBeVisible()

    await page.getByLabel('Thumbnail image (JPG, PNG or WebP)').setInputFiles('tests/e2e/assets/cover.png')
    await expect(page.getByText(/Chosen image: cover\.png/)).toBeVisible()
    await expect(page.getByAltText('Cover preview')).toHaveAttribute('src', /^blob:/)

    await page.getByRole('button', { name: 'Add to the hub' }).click()
    await expect(flashWith(page, title)).toContainText('live on the hub')

    await page.goto('/studio')
    const card = page.locator('main article').filter({ hasText: title })
    const coverSrc = await card.locator('img').getAttribute('src')
    expect(coverSrc).toMatch(/\/api\/uploads\/media\/.+\.webp$/)
    const served = await page.request.get(coverSrc!)
    expect(served.status()).toBe(200)
    expect(served.headers()['content-type']).toContain('image/webp')

    await page.goto('/admin/media')
    const row = page.locator('main li').filter({ hasText: title })
    await expect(row).toContainText('Cover')
    await row.getByRole('link', { name: `Edit ${title}` }).click()
    await expect(page.getByText(/Current cover:/)).toBeVisible()
    await page.getByRole('button', { name: 'Remove cover' }).click()
    await expect(page.getByText(/No cover yet/)).toBeVisible()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(flashWith(page, 'Saved')).toBeVisible()
    expect((await page.request.get(coverSrc!)).status()).toBe(404)

    await page.goto('/studio')
    await expect(page.locator('main article').filter({ hasText: title }).locator('img')).toHaveCount(0)

    const listed = await page.request.get('/api/admin/media')
    const items = (await listed.json()).items as Array<{
      title: string
      sourceUrl: string | null
      coverUrl: string | null
    }>
    const stored = items.find((entry) => entry.title === title)
    expect(stored?.coverUrl, 'the removed cover should be null again').toBeNull()
    const sourceUrl = stored!.sourceUrl!

    await page.goto('/admin/media')
    const cleanup = page.locator('main li').filter({ hasText: title })
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await cleanup.getByRole('button', { name: `Confirm delete ${title}` }).click()
    await expect(flashWith(page, `${title} removed.`)).toBeVisible()

    expect((await page.request.get(sourceUrl)).status()).toBe(404)
  })

  test('ADMIN-014: Play previews the row on the console with staff-only details', { tag: '@p2' }, async ({ page, baseURL }) => {
    const title = `E2E Preview ${Date.now()}`
    const item = await createMediaItemAsAdmin(baseURL, { section: 'video', title, tag: 'KTV' })

    try {
      await page.goto('/admin/media')
      const card = page.locator('main li').filter({ hasText: title })
      await card.getByRole('link', { name: `Play ${title}` }).click()

      await expect(page).toHaveURL('/studio/player-queue')
      await expect(page.getByRole('heading', { name: title })).toBeVisible()

      const details = page.getByRole('region', { name: 'Admin details' })
      await expect(details).toBeVisible()
      await expect(details).toContainText(item.id)
      await expect(details).toContainText('Live on the hub')
      await expect(details).toContainText('None — the stage falls back to the bundled master')
      await expect(details).toContainText('Default art')
      await expect(details.getByRole('link', { name: 'Edit item' })).toHaveAttribute(
        'href',
        `/admin/media/${item.id}`,
      )
    } finally {
      await deleteMediaItemAsAdmin(baseURL, item.id)
    }
  })
})
