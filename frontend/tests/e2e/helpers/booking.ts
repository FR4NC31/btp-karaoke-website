import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Date-picker helpers for the booking modal's shadcn/ui Calendar (a
 * react-day-picker popover behind a trigger button).
 *
 * The trigger's accessible name carries both the label and the chosen day
 * ("Select Date * 11/05/2026"); the popover itself is a Radix `role="dialog"`
 * portalled next to the booking form, so it is located by its stable
 * `data-slot` instead of by role.
 */
export function dateTrigger(page: Page) {
  return page.getByRole('button', { name: /Select Date/ })
}

export function datePicker(page: Page) {
  return page.locator('[data-slot="popover-content"]')
}

/** `2026-11-05` → the trigger's `11/05/2026` display text. */
export function pickerLabel(day: string): string {
  const [year, month, date] = day.split('-')
  return `${month}/${date}/${year}`
}

/**
 * Opens the date popover and navigates it to the day's month. The calendar
 * uses `captionLayout="dropdown"` — month select first, year second — and the
 * year is set first so month clamping can never push the target out of range.
 */
export async function openDatePicker(page: Page, day: string): Promise<Locator> {
  await dateTrigger(page).click()
  const popover = datePicker(page)
  await expect(popover).toBeVisible()
  const [year, month] = day.split('-').map(Number)
  await popover.locator('select').nth(1).selectOption(String(year))
  await popover.locator('select').nth(0).selectOption(String(month - 1))
  return popover
}

/** Picks the day in the shadcn Calendar, closes the popover, and asserts the
 *  trigger now displays the chosen day. */
export async function pickDate(page: Page, day: string): Promise<void> {
  const popover = await openDatePicker(page, day)
  await popover.locator(`td[data-day="${day}"] button`).click()
  await expect(popover).toBeHidden()
  await expect(dateTrigger(page)).toContainText(pickerLabel(day))
}

/** A day 400–699 days out — the suite's random booking pool. */
export function farFutureDay(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 400 + Math.floor(Math.random() * 300))
  return d.toISOString().slice(0, 10)
}

/**
 * A pool day with no reservation (and no studio closure) on the account
 * yet. Earlier runs leave rows behind (their cleanups only run when they
 * pass): a leftover live one makes the API 409 ("already has a booking …
 * at this time slot"), a leftover terminal one collides with the service +
 * ISO-day row locator once the archive toggle shows it, and a blocked day
 * is disabled in the calendar so `pickDate` could never click it. The
 * random pool is therefore filtered against `GET /api/bookings` and
 * `GET /api/bookings/blockouts` (plus any days the caller passes, e.g. the
 * sibling day of a two-day scenario) until a free day turns up.
 */
export async function unusedDay(page: Page, ...avoid: string[]): Promise<string> {
  const used = new Set<string>(avoid)
  const bookingsRes = await page.request.get('/api/bookings')
  if (!bookingsRes.ok()) {
    throw new Error(`GET /api/bookings failed: ${bookingsRes.status()}`)
  }
  const bookingsBody = (await bookingsRes.json()) as { bookings: Array<{ bookingDate: string }> }
  for (const row of bookingsBody.bookings) used.add(row.bookingDate)

  const closuresRes = await page.request.get('/api/bookings/blockouts')
  if (!closuresRes.ok()) {
    throw new Error(`GET /api/bookings/blockouts failed: ${closuresRes.status()}`)
  }
  const closuresBody = (await closuresRes.json()) as { blockouts: Array<{ bookingDate: string }> }
  for (const row of closuresBody.blockouts) used.add(row.bookingDate)

  // Walk the pool deterministically so a free day is returned whenever one
  // exists (random sampling could miss it and throw prematurely).
  const base = new Date()
  for (let offset = 100; offset <= 650; offset += 1) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + offset)
    const day = d.toISOString().slice(0, 10)
    if (!used.has(day)) return day
  }
  throw new Error('no free day left in the 100–650 booking pool')
}
