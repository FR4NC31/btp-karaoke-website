import { request as rawRequest } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import {
  ADMIN_STORAGE_STATE,
  ANONYMOUS,
  TEST_USER,
  signInAsAdmin,
} from '../helpers/auth'

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
})
