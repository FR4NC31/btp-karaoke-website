import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { ANONYMOUS } from '../helpers/auth'


function farFutureDay(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 400 + Math.floor(Math.random() * 300))
  return d.toISOString().slice(0, 10)
}

function topBar(page: Page) {
  return page.getByRole('banner')
}

function serviceCard(page: Page, name: RegExp) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name }) })
}

function myBookings(page: Page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'My bookings' }) })
}

function sidebar(page: Page) {
  return page.locator('aside').filter({ has: page.getByRole('heading', { name: 'Catalog Stacks' }) })
}

function bookingRow(page: Page, reference: string) {
  return myBookings(page).locator('li').filter({ hasText: reference })
}

async function openDesk(page: Page) {
  await page.goto('/studio/bookings')
  await expect(page.getByRole('heading', { name: 'Booking Desk', level: 1 })).toBeVisible()
}

function confirmation(page: Page) {
  return page.getByRole('status').filter({ hasText: 'reference' })
}

async function bookService(
  page: Page,
  card: Locator,
  day: string,
  notes?: string,
  slot?: string,
): Promise<string> {
  await card.getByRole('button', { name: 'Book this service' }).click()
  await page.getByLabel('Session date').fill(day)
  if (slot) await page.getByLabel('Session time').fill(slot)
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

    await expect(page.getByRole('article')).toHaveCount(10)
    await expect(serviceCard(page, /karaoke music video/i)).toContainText('1,000.00')
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
    await expect(page.getByRole('article')).toHaveCount(10)

    await page.getByRole('button', { name: 'FILSCAP & Membership' }).click()
    await expect(page.getByRole('button', { name: 'FILSCAP & Membership' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('article')).toHaveCount(1)

    await page.getByRole('button', { name: 'All services' }).click()
    await expect(page.getByRole('article')).toHaveCount(10)
  })

  test('BOOKING-004: a day booking is created, listed as pending, then cancelled', { tag: '@p1' }, async ({ page }) => {
    await openDesk(page)
    const day = farFutureDay()
    const card = serviceCard(page, /karaoke music video/i)

    await card.getByRole('button', { name: 'Book this service' }).click()

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
    await expect(row).toContainText('E2E day booking')

    await row.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(row).toContainText('cancelled')
    await expect(row.getByRole('button', { name: 'Cancel booking' })).toBeHidden()
  })

  test('BOOKING-005: the same service on the same day cannot be booked twice', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    const day = farFutureDay()
    const card = serviceCard(page, /musical arranging/i)

    const reference = await bookService(page, card, day, 'E2E duplicate probe')

    await card.getByRole('button', { name: 'Book this service' }).click()
    await page.getByLabel('Session date').fill(day)
    await page.getByRole('button', { name: 'Confirm booking' }).click()
    await expect(page.getByRole('alert')).toContainText('already have a booking')

    const row = bookingRow(page, reference)
    await row.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(row).toContainText('cancelled')
  })

  test('BOOKING-008: a time-based service books a date with a time slot', { tag: '@p1' }, async ({ page }) => {
    await openDesk(page)
    const day = farFutureDay()
    // Music Studio Recording bills per hour, so the form must expose a time field.
    const card = serviceCard(page, /music studio recording/i)

    await card.getByRole('button', { name: 'Book this service' }).click()

    const timeField = page.getByLabel('Session time')
    await expect(timeField).toBeVisible()
    // Regression guard: a backslide that renders the time field but lets an
    // hourly booking submit without a slot must fail here.
    await expect(timeField).toHaveAttribute('required', '')

    await page.getByLabel('Session date').fill(day)
    await timeField.fill('14:30')
    await page.getByLabel('Notes (optional)').fill('E2E time slot booking')
    await page.getByRole('button', { name: 'Confirm booking' }).click()

    const flash = confirmation(page)
    await expect(flash).toBeVisible()
    const reference = (await flash.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
    expect(reference, 'the confirmation should carry a BTP reference code').toBeTruthy()

    const row = bookingRow(page, reference!)
    await expect(row).toBeVisible()
    await expect(row).toContainText('pending')
    await expect(row).toContainText('14:30', 'the slot should show with the day, not "all day"')
    await expect(row).toContainText('E2E time slot booking')

    await row.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(row).toContainText('cancelled')
  })

  test('BOOKING-009: the same time slot cannot be booked twice, but another slot can', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    const day = farFutureDay()
    // Studio Radio Online bills per 60-minute broadcast — a different
    // time-based family from BOOKING-008's hourly service.
    const card = serviceCard(page, /studio radio online/i)

    const reference = await bookService(page, card, day, 'E2E slot duplicate probe', '09:00')

    // Same service, same day, same slot → the time-slot unique index wins.
    await card.getByRole('button', { name: 'Book this service' }).click()
    await page.getByLabel('Session date').fill(day)
    await page.getByLabel('Session time').fill('09:00')
    await page.getByRole('button', { name: 'Confirm booking' }).click()
    await expect(page.getByRole('alert')).toContainText('booking for this service at this time slot')

    // A different slot on the same service + day is allowed — this is what
    // distinguishes the time-slot index from the old day-wide one.
    const secondReference = await bookService(page, card, day, 'E2E second slot', '10:45')

    for (const rowRef of [reference, secondReference]) {
      const row = bookingRow(page, rowRef)
      await row.getByRole('button', { name: 'Cancel booking' }).click()
      await expect(row).toContainText('cancelled')
    }
  })

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('BOOKING-006: the top bar still reaches the desk when the sidebar is hidden', { tag: '@p2' }, async ({ page }) => {
      await openDesk(page)

      await expect(sidebar(page)).toBeHidden()
      await expect(topBar(page).getByRole('link', { name: 'Bookings' })).toBeVisible()
      await expect(page.getByRole('article')).toHaveCount(10)
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
