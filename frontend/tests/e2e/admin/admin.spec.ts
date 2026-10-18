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

/**
 * ADMIN — the /admin console itself.
 *
 * Every test here runs on the promoted QA admin session
 * (setup/admin.setup.ts snapshots it into ADMIN_STORAGE_STATE); the sign-in
 * test below opts out to drive the real form.
 *
 * Cleanup is part of the flow, not an afterthought — the same discipline as
 * booking.spec.ts. A database-level rule shapes it: the partial unique index
 * counts only `pending`/`confirmed` rows, so a reservation is "released" once
 * it reaches a terminal state. Tests that create a booking for the shared qa
 * user therefore finish by driving it to a terminal status (completed or
 * cancelled), and every day is randomised 400–699 days out so parallel
 * workers cannot collide on that index.
 */

/** Randomised day: 400–699 days out, inside the server's 730-day guard. */
function farFutureDay(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 400 + Math.floor(Math.random() * 300))
  return d.toISOString().slice(0, 10)
}

/** The top bar of whichever shell is rendered (mirrors booking.spec.ts). */
function topBar(page: Page) {
  return page.getByRole('banner')
}

/** The "Pending approvals" queue on the overview, scoped so other lists never match. */
function pendingQueue(page: Page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'Pending approvals' }) })
}

/** One reservation row on /admin/bookings, addressed by its reference code. */
function reservationRow(page: Page, reference: string) {
  return page.locator('main li').filter({ hasText: reference })
}

/** Flash messages always carry the reference code — the safest anchor. */
function flashWith(page: Page, text: string) {
  return page.getByRole('status').filter({ hasText: text })
}

function referenceFrom(text: string): string {
  const reference = text.match(/BTP-[A-Z2-9]{6}/)?.[0]
  expect(reference, 'the flash should carry a BTP reference code').toBeTruthy()
  return reference!
}

/** Looks a seeded service up by its stable code, returning the row id. */
async function serviceIdByCode(api: APIRequestContext, code: string): Promise<string> {
  const response = await api.get('/api/services')
  const body = await response.json()
  const match = body.services.find((service: { code: string }) => service.code === code)
  expect(match, `service ${code} should be seeded`).toBeTruthy()
  return match.id
}

/**
 * Creates a `pending` reservation the way a customer would: sign in as
 * qa@example.com in a throwaway API context, then POST the booking. The admin
 * console then has a real queue item to act on, produced through the same
 * endpoint the booking desk uses.
 */
async function createPendingAsCustomer(
  baseURL: string | undefined,
  serviceCode: string,
): Promise<{ id: string; referenceCode: string }> {
  const context = await rawRequest.newContext({ baseURL })
  try {
    // Origin header, like a browser sends: Better Auth's fetch-metadata CSRF
    // middleware requires it on credentialed POSTs, and these clients send
    // sec-fetch-mode (which triggers the check).
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
    // Answered reservations leave the queue.
    await expect(row).toBeHidden()

    // Close the loop on the reservations page — and release the day: a
    // completed booking drops out of the unique index that blocks rebooking.
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

    // `rejected` is terminal and already outside the unique index — no
    // cleanup needed. The reservations page shows the row for the record.
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

    await page.goto('/admin/bookings/new')
    await page.getByRole('button', { name: 'Guest name' }).click()
    await page.getByLabel('Guest name').fill(guestName)
    await page.getByLabel('Service').selectOption(serviceId)
    await page.getByLabel('Session date').fill(farFutureDay())
    await page.getByRole('button', { name: 'Save reservation' }).click()

    const flash = flashWith(page, 'reference')
    await expect(flash).toBeVisible()
    const referenceCode = referenceFrom(await flash.innerText())
    // Admin-taken reservations are born confirmed — the admin IS the approval.
    await expect(flash).toContainText('confirmed')
    await expect(flash).toContainText(guestName)

    // The row shows up in the list, marked as a guest booking.
    await page.goto('/admin/bookings')
    await page.getByLabel('Search').fill(referenceCode)
    await page.getByRole('button', { name: 'Search' }).click()

    const listed = reservationRow(page, referenceCode)
    await expect(listed).toContainText('confirmed')
    await expect(listed).toContainText('Guest')
    await expect(listed).toContainText(guestName)

    // Cleanup: cancel it — terminal state, and it never occupied the unique
    // index anyway (guest rows have no userId).
    await listed.getByRole('button', { name: 'Cancel' }).click()
    await expect(flashWith(page, `${referenceCode} is now cancelled.`)).toBeVisible()
    await expect(listed).toContainText('cancelled')
  })

  test('ADMIN-005: the admin tags a registered customer instead of a guest', { tag: '@p1' }, async ({ page, request }) => {
    const serviceId = await serviceIdByCode(request, 'FILSCAP-PORTAL')

    await page.goto('/admin/bookings/new')
    // 'Registered customer' is the default mode; tag the shared QA user.
    await page.getByLabel('Find an account').fill(TEST_USER.email)
    await page.getByRole('button').filter({ hasText: TEST_USER.email }).click()
    await page.getByLabel('Service').selectOption(serviceId)
    await page.getByLabel('Session date').fill(farFutureDay())
    await page.getByRole('button', { name: 'Save reservation' }).click()

    const flash = flashWith(page, 'reference')
    await expect(flash).toBeVisible()
    const referenceCode = referenceFrom(await flash.innerText())
    await expect(flash).toContainText('confirmed')

    // The reservation belongs to the account — it shows the email, not a
    // guest badge.
    await page.goto('/admin/bookings')
    await page.getByLabel('Search').fill(referenceCode)
    await page.getByRole('button', { name: 'Search' }).click()

    const listed = reservationRow(page, referenceCode)
    await expect(listed).toContainText('confirmed')
    await expect(listed).toContainText(TEST_USER.email)
    await expect(listed).not.toContainText('Guest')

    // Cleanup + the full confirmed -> completed move from the list page.
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
    // Guest-only pages bounce by role…
    await page.goto('/signin')
    await expect(page).toHaveURL('/admin')
    await page.goto('/signup')
    await expect(page).toHaveURL('/admin')

    // …and so does the landing page's auth dialog: clicking Sign In while
    // already authenticated used to hardcode /studio (the customer hub).
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
    // The editor swaps fields per type: music wants tempo/key, not duration.
    await page.getByLabel('Type').selectOption('music')
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Description').fill('E2E mixdown notes')
    await page.getByLabel('Tempo').fill('120 BPM')
    await page.getByLabel('Key', { exact: true }).fill('Am')
    await page.getByRole('button', { name: 'Add to the hub' }).click()

    const flash = flashWith(page, title)
    await expect(flash).toBeVisible()
    await expect(flash).toContainText('live on the hub')

    // The console lists it as a live music row…
    await page.goto('/admin/media')
    const row = page.locator('main li').filter({ hasText: title })
    await expect(row).toContainText('Live')
    await expect(row).toContainText('120 BPM')
    await expect(row).toContainText('Key Am')

    // …and the studio hub renders the card.
    await page.goto('/studio')
    const card = page.locator('main article').filter({ hasText: title })
    await expect(card).toContainText('E2E mixdown notes')
    await expect(card).toContainText('120 BPM')

    // Cleanup through the console's delete button — it asks for
    // confirmation first, so a stray click can never drop a live row.
    await page.goto('/admin/media')
    const cleanup = page.locator('main li').filter({ hasText: title })
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await expect(cleanup.getByRole('button', { name: `Confirm delete ${title}` })).toBeVisible()
    // Cancel leaves the row exactly where it was…
    await cleanup.getByRole('button', { name: `Cancel delete ${title}` }).click()
    await expect(cleanup).toContainText('Live')
    await expect(cleanup.getByRole('button', { name: `Confirm delete ${title}` })).toHaveCount(0)
    // …confirm removes it for good.
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

    // The section list's row index for a title (admin list, video group).
    const rowIndexOf = async (needle: string) => {
      const texts = await page.locator('main li').allTextContents()
      return texts.findIndex((text) => text.includes(needle))
    }

    try {
      await page.goto('/admin/media')
      const betaRow = page.locator('main li').filter({ hasText: beta })
      await expect(betaRow).toContainText('Live')

      // Hide → the row stays manageable but leaves the hub.
      await betaRow.getByRole('button', { name: `Hide ${beta}` }).click()
      await expect(flashWith(page, `${beta} is now hidden.`)).toBeVisible()
      await expect(betaRow).toContainText('Hidden')

      await page.goto('/studio')
      await expect(page.locator('main article').filter({ hasText: alpha })).toBeVisible()
      await expect(page.locator('main article').filter({ hasText: beta })).toHaveCount(0)

      // Show it again — back on the hub.
      await page.goto('/admin/media')
      const shownRow = page.locator('main li').filter({ hasText: beta })
      await shownRow.getByRole('button', { name: `Show ${beta}` }).click()
      await expect(flashWith(page, `${beta} is now live.`)).toBeVisible()
      await expect(shownRow).toContainText('Live')

      // Reorder: beta moves one slot earlier in its section.
      const before = await rowIndexOf(beta)
      await shownRow.getByRole('button', { name: `Move ${beta} up` }).click()
      await expect(flashWith(page, `${beta} moved up.`)).toBeVisible()
      await expect.poll(() => rowIndexOf(beta)).toBeLessThan(before)

      // Edit the copy through the editor page.
      await page.locator('main li').filter({ hasText: beta }).getByRole('link', { name: `Edit ${beta}` }).click()
      await expect(page).toHaveURL(/\/admin\/media\//)
      await expect(page.getByLabel('Title', { exact: true })).toHaveValue(beta)
      await page.getByLabel('Title', { exact: true }).fill(`${beta} v2`)
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(flashWith(page, 'Saved')).toBeVisible()

      await page.goto('/admin/media')
      await expect(page.locator('main li').filter({ hasText: `${beta} v2` })).toContainText('Live')
    } finally {
      // API cleanup: works even if the UI half of the test failed midway.
      await deleteMediaItemAsAdmin(baseURL, alphaItem.id)
      await deleteMediaItemAsAdmin(baseURL, betaItem.id)
    }
  })

  test('ADMIN-009: the admin uploads an MP4 and the hub really plays it', { tag: '@p1' }, async ({ page }) => {
    const title = `E2E Upload ${Date.now()}`

    // The editor takes a real file: the LFS master doubles as the fixture.
    await page.goto('/admin/media/new')
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Artist').fill('E2E performer')
    await page.getByLabel('Video file (MP4)').setInputFiles('src/assets/video_local/the-reason.mp4')
    await expect(page.getByText(/Ready to upload: the-reason\.mp4/)).toBeVisible()
    // Duration is read off the picked file itself — no manual typing.
    await expect(page.getByLabel('Duration')).toHaveValue(/^\d+:\d{2}(:\d{2})?$/)

    await page.getByRole('button', { name: 'Add to the hub' }).click()
    await expect(flashWith(page, title)).toContainText('live on the hub')

    // The console row shows the attached-file badge…
    await page.goto('/admin/media')
    const row = page.locator('main li').filter({ hasText: title })
    await expect(row).toContainText('MP4 file')

    // …and the hub card opens the console playing that very upload.
    await page.goto('/studio')
    await page.getByRole('link', { name: `Play ${title}` }).click()
    await expect(page).toHaveURL('/studio/player-queue')

    const video = page.locator('main video')
    const src = await video.getAttribute('src')
    expect(src, 'the stage should point at the stored upload').toContain('/api/uploads/media/')
    await expect(page.getByRole('contentinfo')).toContainText(title)
    await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false)

    // Stored media answers byte ranges — uploaded videos are seek-ready.
    const ranged = await page.request.get(src!, { headers: { Range: 'bytes=0-99' } })
    expect(ranged.status()).toBe(206)
    expect(ranged.headers()['content-range']).toMatch(/^bytes 0-99\/\d+$/)

    // Cleanup through the confirm flow: the stored file dies with the row.
    await page.goto('/admin/media')
    const cleanup = page.locator('main li').filter({ hasText: title })
    await cleanup.getByRole('button', { name: `Delete ${title}` }).click()
    await cleanup.getByRole('button', { name: `Confirm delete ${title}` }).click()
    await expect(flashWith(page, `${title} removed.`)).toBeVisible()
    await expect(cleanup).toBeHidden()

    const gone = await page.request.get(src!)
    expect(gone.status(), 'the uploaded file should be deleted with its row').toBe(404)
  })

  test('ADMIN-010: the uploader rejects files that are not real MP4/MP3 media', { tag: '@p2' }, async ({ baseURL }) => {
    // Wrong extension: rejected before a single byte lands on disk.
    const text = await uploadMediaFileAsAdmin(baseURL, {
      name: 'notes.txt',
      mimeType: 'text/plain',
      data: 'definitely not media',
    })
    expect(text.status).toBe(400)
    expect(text.body.error).toBe('Only MP4 video or MP3 audio files can be uploaded.')

    // Accepted extension, but the content type disagrees — also rejected.
    const mismatch = await uploadMediaFileAsAdmin(baseURL, {
      name: 'track.mp3',
      mimeType: 'video/mp4',
      data: 'definitely not media',
    })
    expect(mismatch.status).toBe(400)
    expect(mismatch.body.error).toContain('does not match')

    // Anonymous callers never reach the uploader (requireAdmin on the sub-app).
    // Without the explicit ANONYMOUS state the fresh context would inherit the
    // suite's admin session and the probe would pass for the wrong reason.
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
})
