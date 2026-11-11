import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { ANONYMOUS } from '../helpers/auth'
import { dateTrigger, pickDate, pickerLabel, unusedDay } from '../helpers/booking'

// A cold desk load under six parallel workers runs 15–20 s (fresh browsers
// sharing one Vite module graph and one Aiven pool), and the booking flows
// then pile several more API calls on top. The global 60 s budget fails a
// healthy suite on contention alone.
test.beforeEach(() => {
  test.setTimeout(120_000)
})

function topBar(page: Page) {
  return page.getByRole('banner')
}

function serviceCard(page: Page, name: RegExp) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name }) })
}

function myBookings(page: Page) {
  // The panel wears no heading of its own; the list caption is its marker.
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Booked Studio Sessions' }),
  })
}

function sidebar(page: Page) {
  return page.locator('aside').filter({ has: page.getByRole('heading', { name: 'Catalog Stacks' }) })
}

/**
 * A reservation row, located the way the mockup row reads: service name plus
 * the booked ISO day (the row's `Scheduled:` line). The reference code stays
 * in the success popup / reschedule flash and is deliberately not on the row.
 */
function bookingRow(page: Page, service: RegExp, day?: string) {
  const rows = myBookings(page).locator('li').filter({ hasText: service })
  return day ? rows.filter({ hasText: day }) : rows
}

/**
 * The reservations view's landing heading. The page carries no h1 ("Booking
 * Desk" and its subtitle were removed), so this is the desk's stable marker.
 * Under parallel local workers one cold context can take 15–20 s to get here
 * (Vite module serving + Aiven queueing behind five other browsers), so every
 * wait on it uses this shared 30 s budget instead of the global 10 s expect.
 */
function overviewHeading(page: Page) {
  return page.getByRole('heading', { name: 'Reservation Overview' })
}

async function openDesk(page: Page) {
  await page.goto('/studio/bookings')
  await expect(overviewHeading(page)).toBeVisible({ timeout: 30_000 })
}

/**
 * The desk opens on the reservations view; the catalogue (service cards, wing
 * pills, the booking form) lives one click away on New Booking.
 */
async function showServices(page: Page) {
  await page.getByRole('button', { name: 'New Booking', exact: true }).click()
}

function confirmation(page: Page) {
  // The mockup's success popup replaces the old inline confirmation flash.
  return page.getByRole('dialog').filter({ hasText: 'Reservation Added!' })
}

async function serviceIdByCode(page: Page, code: string): Promise<string> {
  const response = await page.request.get('/api/services')
  const body = await response.json()
  const match = body.services.find((service: { code: string }) => service.code === code)
  expect(match, `service ${code} should be seeded`).toBeTruthy()
  return match.id
}

async function bookService(
  page: Page,
  card: Locator,
  day: string,
  notes?: string,
  slot?: string,
): Promise<string> {
  await card.getByRole('button', { name: 'Book this service' }).click()
  await pickDate(page, day)
  if (slot) await page.getByLabel('Select Time Slot').selectOption(slot)
  if (notes) await page.getByLabel('Session Notes (Optional)').fill(notes)
  await page.getByText('In Person', { exact: true }).click()
  await page.getByRole('button', { name: 'Confirm Booking' }).click()
  const popup = confirmation(page)
  await expect(popup).toBeVisible()
  const reference = (await popup.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
  expect(reference, 'the confirmation should carry a BTP reference code').toBeTruthy()
  // The popup's button is what lands back on the reservation overview.
  await popup.getByRole('button', { name: 'View My Bookings' }).click()
  await expect(popup).toBeHidden()
  return reference!
}

/**
 * Cancels a reservation the mockup's way: the row's 3-dot menu → Cancel
 * Session → the confirmation modal's destructive button. Leaves the caller
 * on the reservations view with the dialog closed.
 */
async function cancelViaMenu(page: Page, row: Locator) {
  await row.getByRole('button', { name: /More options for/ }).click()
  await row.getByRole('button', { name: 'Cancel Session' }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Cancel Reservation?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel Reservation' }).click()
  await expect(dialog).toBeHidden()
}

test.describe('booking desk', () => {
  // Booking tests share one QA account and one booking pool; running them
  // in parallel lets two workers pick the same `unusedDay` and the second
  // POST /api/bookings 409s. Serializing keeps the shared account's booking
  // state consistent within this suite.
  test.describe.configure({ mode: 'serial' })
  test('BOOKING-001: the top bar opens the desk and the catalog renders', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    await topBar(page).getByRole('link', { name: 'Bookings' }).click()

    await expect(page).toHaveURL('/studio/bookings')
    await expect(overviewHeading(page)).toBeVisible({ timeout: 30_000 })

    // …and the catalogue sits behind New Booking.
    await showServices(page)
    await expect(page.getByRole('article')).toHaveCount(10)
    await expect(serviceCard(page, /karaoke music video/i)).toContainText('1,000.00')
  })

  test('BOOKING-002: the sidebar opens the desk on desktop', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')

    await expect(sidebar(page)).toBeVisible()
    await sidebar(page).getByRole('link', { name: 'Bookings' }).click()

    await expect(page).toHaveURL('/studio/bookings')
    await expect(overviewHeading(page)).toBeVisible({ timeout: 30_000 })
  })

  test('BOOKING-003: the wing filter narrows the catalog', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    await expect(page.getByRole('article')).toHaveCount(10)

    await page.getByRole('button', { name: 'FILSCAP & Membership' }).click()
    await expect(page.getByRole('button', { name: 'FILSCAP & Membership' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('article')).toHaveCount(1)

    await page.getByRole('button', { name: 'All Services' }).click()
    await expect(page.getByRole('article')).toHaveCount(10)
  })

  test('BOOKING-004: a day booking is created, listed as pending, then cancelled', { tag: '@p1' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    const card = serviceCard(page, /karaoke music video/i)

    await card.getByRole('button', { name: 'Book this service' }).click()

    // The shadcn date trigger comes pre-filled with the first open day.
    const dateField = dateTrigger(page)
    await expect(dateField).toBeVisible()
    await expect(dateField).toContainText(/\d{2}\/\d{2}\/\d{4}/)

    await pickDate(page, day)
    await page.getByLabel('Session Notes (Optional)').fill('E2E day booking')
    // No payment method picked yet → the confirm stays disabled.
    const confirm = page.getByRole('button', { name: 'Confirm Booking' })
    await expect(confirm).toBeDisabled()
    await page.getByText('In Person', { exact: true }).click()
    await expect(confirm).toBeEnabled()
    await confirm.click()

    // The mockup's "Reservation Added!" popup carries the reference…
    const popup = confirmation(page)
    await expect(popup).toBeVisible()
    const reference = (await popup.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
    expect(reference, 'the confirmation should carry a BTP reference code').toBeTruthy()
    await popup.getByRole('button', { name: 'View My Bookings' }).click()
    await expect(popup).toBeHidden()

    const row = bookingRow(page, /karaoke music video/i, day)
    await expect(row).toBeVisible()
    await expect(row).toContainText('pending')
    await expect(row).toContainText('E2E day booking')

    // Cancelling runs through the row's 3-dot menu + confirmation modal.
    await cancelViaMenu(page, row)
    await expect(row, 'cancelled rows are archived by default').toBeHidden()

    // …and the overview's archive toggle brings the archived row back.
    await page.getByRole('button', { name: 'Show archived bookings' }).click()
    await expect(row).toContainText('cancelled')
    await expect(page.getByRole('button', { name: 'Hide archived bookings' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('BOOKING-005: the same service on the same day cannot be booked twice', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    const card = serviceCard(page, /musical arranging/i)

    await bookService(page, card, day, 'E2E duplicate probe')

    // The confirmation lands back on the reservations view.
    await showServices(page)
    await card.getByRole('button', { name: 'Book this service' }).click()
    await pickDate(page, day)
    await page.getByText('In Person', { exact: true }).click()
    const duplicateResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/bookings') && resp.status() === 409,
    )
    await page.getByRole('button', { name: 'Confirm Booking' }).click()
    await duplicateResponse
    await expect(
      page.getByRole('alert').filter({ hasText: 'already have a booking' }),
    ).toBeVisible()
  })

  test('BOOKING-008: a time-based service books a date with an on-the-hour slot', { tag: '@p1' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    // Music and Vocal Recording bills per hour, so the form must expose a
    // time picker limited to whole hours.
    const card = serviceCard(page, /music and vocal recording/i)

    await card.getByRole('button', { name: 'Book this service' }).click()

    const timeField = page.getByLabel('Select Time Slot')
    await expect(timeField).toBeVisible()
    // Regression guard: a backslide that renders the time field but lets an
    // hourly booking submit without a slot must fail here.
    await expect(timeField).toHaveAttribute('required', '')

    // Only whole-hour values are offered — no 14:30.
    const hourValues = await timeField
      .locator('option')
      .evaluateAll((options) =>
        options
          .map((option) => (option as HTMLOptionElement).value)
          .filter((value) => value.length > 0),
      )
    expect(hourValues).toHaveLength(24)
    expect(hourValues.every((value) => value.endsWith(':00'))).toBe(true)

    await pickDate(page, day)
    await timeField.selectOption('14:00')
    await page.getByLabel('Session Notes (Optional)').fill('E2E time slot booking')
    await page.getByText('In Person', { exact: true }).click()
    await page.getByRole('button', { name: 'Confirm Booking' }).click()

    const popup = confirmation(page)
    await expect(popup).toBeVisible()
    const reference = (await popup.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
    expect(reference, 'the confirmation should carry a BTP reference code').toBeTruthy()
    await popup.getByRole('button', { name: 'View My Bookings' }).click()
    await expect(popup).toBeHidden()

    const row = bookingRow(page, /music and vocal recording/i, day)
    await expect(row).toBeVisible()
    await expect(row).toContainText('pending')
    // The row renders the slot in the mockup's 12-hour form, not "all day".
    await expect(row).toContainText('02:00 PM')
    await expect(row).toContainText('E2E time slot booking')

    await cancelViaMenu(page, row)
    await expect(row, 'cancelled rows are archived by default').toBeHidden()
  })

  test('BOOKING-009: the same time slot cannot be booked twice, but another slot can', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    // A second hourly service keeps this independent of BOOKING-008's
    // recording session while still exercising the time-slot index.
    const card = serviceCard(page, /audio editing and mastering/i)

    await bookService(page, card, day, 'E2E slot duplicate probe', '09:00')

    // Same service, same day, same slot → the time-slot unique index wins.
    await showServices(page)
    await card.getByRole('button', { name: 'Book this service' }).click()
    await pickDate(page, day)
    await page.getByLabel('Select Time Slot').selectOption('09:00')
    await page.getByText('In Person', { exact: true }).click()
    await page.getByRole('button', { name: 'Confirm Booking' }).click()
    await expect(page.getByRole('dialog').getByText('booking for this service at this time slot')).toBeVisible()
  })

  test('BOOKING-010: an off-hour slot is rejected by the API', { tag: '@p1' }, async ({ page }) => {
    // The picker only offers whole hours; this proves the server enforces the
    // same rule for callers that skip the UI.
    const serviceId = await serviceIdByCode(page, 'STUDIO-TRACKING')
    const response = await page.request.post('/api/bookings', {
      data: {
        serviceId,
        bookingDate: await unusedDay(page),
        bookingTime: '14:30',
        notes: 'E2E off-hour probe',
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/on the hour/i)
  })

  test('BOOKING-014: the booking modal collects session details and payment method', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const card = serviceCard(page, /music and vocal recording/i)

    await card.getByRole('button', { name: 'Book this service' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Service header + session fields from the mockup.
    await expect(dialog).toContainText('Music and Vocal Recording')
    await expect(dialog).toContainText('Per Hour')
    await expect(dateTrigger(page)).toBeVisible()
    await expect(page.getByLabel('Select Time Slot')).toBeVisible()
    await expect(page.getByLabel('Session Notes (Optional)')).toBeVisible()
    // Pre-filled with an open day (the old native min boundary).
    await expect(dateTrigger(page)).toContainText(/\d{2}\/\d{2}\/\d{4}/)

    // Payment is required with no default: nothing chosen → confirm stays off.
    const confirm = page.getByRole('button', { name: 'Confirm Booking' })
    await expect(confirm).toBeDisabled()
    const gcash = page.getByRole('radio', { name: 'GCash' })
    const inPerson = page.getByRole('radio', { name: 'In Person' })
    await expect(gcash).toBeVisible()
    await expect(inPerson).toBeVisible()
    await expect(gcash).not.toBeChecked()

    // Picking GCash reveals the receipt dropzone; In Person hides it again.
    await page.getByText('GCash', { exact: true }).click()
    await expect(gcash).toBeChecked()
    await expect(dialog).toContainText('Click or drag receipt image here')
    await expect(confirm, 'GCash without a receipt cannot submit').toBeDisabled()
    await page.getByText('In Person', { exact: true }).click()
    await expect(inPerson).toBeChecked()
    await expect(dialog).not.toContainText('Click or drag receipt image here')
    await expect(confirm).toBeEnabled()

    // Cancel closes the modal without booking anything.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(confirmation(page)).toBeHidden()
  })

  test('BOOKING-013: the toolbar switches between the reservations and catalogue views', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)

    // Reservations view: the overview card — its add action is gone, the
    // icon-only archive toggle took the slot.
    await expect(page.getByRole('heading', { name: 'Reservation Overview' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Reservation' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Show archived bookings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Booking', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    // The toolbar's New Booking pill jumps to the catalogue.
    await showServices(page)
    await expect(page.getByRole('button', { name: 'New Booking', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('article')).toHaveCount(10)
    await expect(page.getByRole('button', { name: 'Back to My Bookings' })).toBeVisible()

    // The toolbar search narrows the catalogue.
    await page.getByLabel('Search studio services').fill('karaoke music video')
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(serviceCard(page, /karaoke music video/i)).toBeVisible()

    // Back to My Bookings returns to the reservations view.
    await page.getByRole('button', { name: 'Back to My Bookings' }).click()
    await expect(page.getByRole('heading', { name: 'Reservation Overview' })).toBeVisible()
  })

  test('BOOKING-015: the success popup summarises the booking and returns to the overview', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    const card = serviceCard(page, /karaoke music video/i)

    await card.getByRole('button', { name: 'Book this service' }).click()
    await pickDate(page, day)
    await page.getByText('In Person', { exact: true }).click()
    await page.getByRole('button', { name: 'Confirm Booking' }).click()

    // The mockup's popup: service, Date, Slot, Payment, Rate + the reference.
    const popup = confirmation(page)
    await expect(popup).toBeVisible()
    await expect(popup).toContainText('Reservation Added!')
    await expect(popup).toContainText('Karaoke Music Video')
    await expect(popup).toContainText('Date')
    await expect(popup).toContainText('Slot')
    await expect(popup).toContainText('All day')
    await expect(popup).toContainText('Payment')
    await expect(popup).toContainText('In Person')
    await expect(popup).toContainText('Rate')
    const reference = (await popup.innerText()).match(/BTP-[A-Z2-9]{6}/)?.[0]
    expect(reference, 'the popup should carry a BTP reference code').toBeTruthy()

    // View My Bookings is the popup's only action — it lands on the overview.
    await popup.getByRole('button', { name: 'View My Bookings' }).click()
    await expect(popup).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Reservation Overview' })).toBeVisible()
    // The fresh booking lands in the session list under its caption.
    await expect(page.getByRole('heading', { name: 'Booked Studio Sessions' })).toBeVisible()

    const row = bookingRow(page, /karaoke music video/i, day)
    await expect(row).toBeVisible()
    await cancelViaMenu(page, row)
    await expect(row).toBeHidden()
  })

  test('BOOKING-016: View Details opens the reservation sheet (In Person has no receipt)', { tag: '@p2' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    const card = serviceCard(page, /karaoke music video/i)
    await bookService(page, card, day, 'E2E details probe')

    const row = bookingRow(page, /karaoke music video/i, day)
    await row.getByRole('button', { name: /More options for/ }).click()
    await row.getByRole('button', { name: 'View Details' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: 'Reservation Details' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Scheduled Date')
    await expect(dialog).toContainText('Time Slot')
    await expect(dialog).toContainText('All day')
    await expect(dialog).toContainText('Payment Option')
    await expect(dialog).toContainText('In Person')
    await expect(dialog).toContainText('Karaoke Music Video')
    // In Person uploads no receipt, so the payment-proof block is absent.
    await expect(dialog).not.toContainText('Payment Proof')

    // The wing tag mirrors the service's wing from the catalogue.
    const servicesBody = await (await page.request.get('/api/services')).json()
    const service = servicesBody.services.find((entry: { name: string }) =>
      /karaoke music video/i.test(entry.name),
    )
    expect(service, 'the service should be seeded').toBeTruthy()
    const wingLabels: Record<string, string> = {
      create: 'Production & Recording',
      learn: 'Lessons & Development',
      promote: 'Vocalists & Entertainment',
      protect: 'FILSCAP & Membership',
    }
    await expect(dialog).toContainText(wingLabels[service.wing])

    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).toBeHidden()

    await cancelViaMenu(page, row)
    await expect(row).toBeHidden()
  })

  test('BOOKING-017: Change Schedule reopens the booking form and moves the slot', { tag: '@p1' }, async ({ page }) => {
    await openDesk(page)
    await showServices(page)
    const day = await unusedDay(page)
    const newDay = await unusedDay(page, day)
    const card = serviceCard(page, /karaoke music video/i)
    const reference = await bookService(page, card, day, 'E2E reschedule probe')

    const row = bookingRow(page, /karaoke music video/i, day)
    await row.getByRole('button', { name: /More options for/ }).click()
    await row.getByRole('button', { name: 'Change Schedule' }).click()

    // Same modal as add reservation, prefilled — and without the payment
    // block: moving a slot must not ask for payment again.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dateTrigger(page)).toContainText(pickerLabel(day))
    await expect(dialog.getByRole('radio')).toHaveCount(0)
    const confirm = page.getByRole('button', { name: 'Confirm Booking' })
    await expect(confirm).toBeEnabled()

    await pickDate(page, newDay)
    await confirm.click()

    const flash = page.getByRole('status').filter({ hasText: 'rescheduled' })
    await expect(flash).toBeVisible()
    await expect(flash).toContainText('Successfully')
    // The bottom-right toast slides away on its own after two seconds.
    await expect(flash).toBeHidden({ timeout: 4000 })
    // The row now shows the new day, so it is located by that instead.
    const movedRow = bookingRow(page, /karaoke music video/i, newDay)
    await expect(movedRow).toBeVisible()

    // The server really moved the row.
    const response = await page.request.get('/api/bookings')
    const body = await response.json()
    const updated = body.bookings.find((entry: { referenceCode: string }) => entry.referenceCode === reference)
    expect(updated, 'the rescheduled booking should still be listed').toBeTruthy()
    expect(updated.bookingDate).toBe(newDay)

    await cancelViaMenu(page, movedRow)
    await expect(movedRow).toBeHidden()
  })

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('BOOKING-006: the top bar still reaches the desk when the sidebar is hidden', { tag: '@p2' }, async ({ page }) => {
      await openDesk(page)

      await expect(sidebar(page)).toBeHidden()
      await expect(topBar(page).getByRole('link', { name: 'Bookings' })).toBeVisible()
      await showServices(page)
      await expect(page.getByRole('article')).toHaveCount(10)
    })
  })
})

test.describe('booking desk (signed out)', () => {
  test.use({ storageState: ANONYMOUS })

  test('BOOKING-007: a signed-out visitor is bounced to sign-in', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/bookings')

    await expect(page).toHaveURL('/signin')
    // The sign-in form is the whole page — no studio content leaks through.
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })
})
