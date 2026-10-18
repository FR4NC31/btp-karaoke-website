import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { ANONYMOUS } from '../helpers/auth'

/**
 * BOOKING — the /studio/bookings desk.
 *
 * Day-only prototype: a booking claims one whole calendar day for one service.
 * Time slots and time blocks do not exist yet, so nothing here may assert on a
 * time of day.
 *
 * Every booking these tests create is cancelled again before the test ends.
 * That is not just tidiness — all suites share one account (qa@example.com)
 * and the database enforces "at most one live booking per service per day"
 * through a partial unique index, so a leaked `pending` row would fail the
 * next run of the same test. Two consequences for how these are written:
 *
 *  - days are randomised roughly one to two years out, so parallel workers
 *    cannot collide on that index;
 *  - assertions are pinned to the reference code the test itself just created,
 *    never to the length of the booking list, which sibling tests are mutating
 *    at the same time.
 *
 * The studio shell renders a 3.5 s skeleton before any route content, which is
 * why the first paint of the desk is awaited through `openDesk()`.
 */

/** Randomised day: 400–699 days out, inside the server's 730-day guard. */
function farFutureDay(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 400 + Math.floor(Math.random() * 300))
  return d.toISOString().slice(0, 10)
}

/**
 * The studio top bar. `getByRole('banner')` rather than `locator('header')`
 * because routed pages render their own <header> inside <main>; only the shell
 * bar is a landmark.
 */
function topBar(page: Page) {
  return page.getByRole('banner')
}

/** The catalog card for one service. */
function serviceCard(page: Page, name: RegExp) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name }) })
}

/** The "My bookings" panel, scoped so confirmation flashes never match. */
function myBookings(page: Page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'My bookings' }) })
}

/**
 * The catalog sidebar. Scoped by its heading, because the mini-player is also
 * an <aside> and `hidden md:flex` is the only thing hiding this one.
 */
function sidebar(page: Page) {
  return page.locator('aside').filter({ has: page.getByRole('heading', { name: 'Catalog Stacks' }) })
}

/** One row of the booking list, addressed by its own reference code. */
function bookingRow(page: Page, reference: string) {
  return myBookings(page).locator('li').filter({ hasText: reference })
}

/** Opens the desk and waits past the shell skeleton. */
async function openDesk(page: Page) {
  await page.goto('/studio/bookings')
  await expect(page.getByRole('heading', { name: 'Booking Desk', level: 1 })).toBeVisible()
}

/** Confirmation flash — the only status message carrying a reference code. */
function confirmation(page: Page) {
  return page.getByRole('status').filter({ hasText: 'reference' })
}

/** Opens the form for a service, fills the day, submits, returns the code. */
async function bookService(
  page: Page,
  card: Locator,
  day: string,
  notes?: string,
): Promise<string> {
  await card.getByRole('button', { name: 'Book this service' }).click()
  await page.getByLabel('Session date').fill(day)
  if (notes) await page.getByLabel('Notes (optional)').fill(notes)
  await page.getByRole('button', { name: 'Confirm booking' }).click()

  const flash = confirmation(page)
  await expect(flash).toBeVisible()
  const reference = (await flash.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
  expect(reference, 'the confirmation should carry a BTP reference code').toBeTruthy()
  return reference!
}

test.describe('booking desk', () => {
  test('BOOKING-001: the top bar opens the desk and the catalog renders', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    await topBar(page).getByRole('link', { name: 'Bookings' }).click()

    await expect(page).toHaveURL('/studio/bookings')
    await expect(page.getByRole('heading', { name: 'Booking Desk', level: 1 })).toBeVisible()

    // Prices and copy come from the seeded service catalog via /api/services,
    // so this also proves the desk is wired to real data, not to a fixture.
    await expect(page.getByRole('article')).toHaveCount(8)
    await expect(serviceCard(page, /karaoke music video/i)).toContainText('55,000.00')
    await expect(page.getByRole('heading', { name: 'My bookings' })).toBeVisible()
  })

  test('BOOKING-002: the sidebar opens the desk on desktop', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')

    await expect(sidebar(page)).toBeVisible()
    await sidebar(page).getByRole('link', { name: 'Bookings' }).click()

    await expect(page).toHaveURL('/studio/bookings')
    await expect(page.getByRole('heading', { name: 'Booking Desk', level: 1 })).toBeVisible()
  })

  test('BOOKING-003: the wing filter narrows the catalog', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await expect(page.getByRole('article')).toHaveCount(8)

    await page.getByRole('button', { name: 'Protect' }).click()
    await expect(page.getByRole('button', { name: 'Protect' })).toHaveAttribute('aria-pressed', 'true')
    // Catalog wings: create 3, promote 2, learn 1, protect 2.
    await expect(page.getByRole('article')).toHaveCount(2)

    await page.getByRole('button', { name: 'All services' }).click()
    await expect(page.getByRole('article')).toHaveCount(8)
  })

  test('BOOKING-004: a day booking is created, listed as pending, then cancelled', { tag: '@p1' }, async ({ page }) => {
    await openDesk(page)
    const day = farFutureDay()
    const card = serviceCard(page, /karaoke music video/i)

    await card.getByRole('button', { name: 'Book this service' }).click()

    // The picker cannot offer a day before the studio's today, and the field
    // opens pre-filled with exactly that boundary.
    const dateField = page.getByLabel('Session date')
    await expect(dateField).toHaveValue((await dateField.getAttribute('min')) ?? '')

    await dateField.fill(day)
    await page.getByLabel('Notes (optional)').fill('E2E day booking')
    await page.getByRole('button', { name: 'Confirm booking' }).click()

    const flash = confirmation(page)
    await expect(flash).toBeVisible()
    const reference = (await flash.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
    expect(reference, 'the confirmation should carry a BTP reference code').toBeTruthy()

    const row = bookingRow(page, reference!)
    await expect(row).toBeVisible()
    await expect(row).toContainText('pending')
    // Notes round-tripped through the API. The day itself is rendered
    // human-readable, so it is asserted at the API level instead.
    await expect(row).toContainText('E2E day booking')

    await row.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(row).toContainText('cancelled')
    // A withdrawn booking can no longer be withdrawn, so the action disappears.
    await expect(row.getByRole('button', { name: 'Cancel booking' })).toBeHidden()
  })

  test('BOOKING-005: the same service on the same day cannot be booked twice', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    const day = farFutureDay()
    const card = serviceCard(page, /musical arranging/i)

    const reference = await bookService(page, card, day, 'E2E duplicate probe')

    // Same service, same day, again. The partial unique index rejects it and
    // the form has to explain why instead of appearing to do nothing.
    await card.getByRole('button', { name: 'Book this service' }).click()
    await page.getByLabel('Session date').fill(day)
    await page.getByRole('button', { name: 'Confirm booking' }).click()
    await expect(page.getByRole('alert')).toContainText('already have a booking')

    // Cleanup: withdraw the live booking so the day is free for the next run.
    const row = bookingRow(page, reference)
    await row.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(row).toContainText('cancelled')
  })

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('BOOKING-006: the top bar still reaches the desk when the sidebar is hidden', { tag: '@p2' }, async ({ page }) => {
      await openDesk(page)

      // Below md the sidebar is not rendered at all, which is why the top bar
      // carries a Bookings link — remove one and this test fails.
      await expect(sidebar(page)).toBeHidden()
      await expect(topBar(page).getByRole('link', { name: 'Bookings' })).toBeVisible()
      await expect(page.getByRole('article')).toHaveCount(8)
    })
  })
})

test.describe('booking desk (signed out)', () => {
  test.use({ storageState: ANONYMOUS })

  test('BOOKING-007: a signed-out visitor is bounced to sign-in', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/bookings')

    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Booking Desk', level: 1 })).toBeHidden()
  })
})
