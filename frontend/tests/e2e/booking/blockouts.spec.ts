import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { ADMIN_STORAGE_STATE } from '../helpers/auth'

test.use({ storageState: ADMIN_STORAGE_STATE })

/**
 * Studio closures (BOOKING-011/012).
 *
 * An admin blocks a whole day from /admin/bookings; the customer desk lists it
 * and refuses the date client-side, and the API refuses it too. Unblocking
 * reopens the day. Days are random and far out, and cleanup runs in `finally`
 * so a failed assertion cannot leave the QA calendar closed.
 */

function farFutureDay(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 500 + Math.floor(Math.random() * 200))
  return d.toISOString().slice(0, 10)
}

// Mirrors frontend/src/lib/booking-format.ts (same locale, same UTC parse).
const dayFormat = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(`${isoDate}T00:00:00Z`))
}

function closures(page: Page) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Studio closures' }),
  })
}

async function serviceIdByCode(page: Page, code: string): Promise<string> {
  const response = await page.request.get('/api/services')
  const body = await response.json()
  const match = body.services.find((service: { code: string }) => service.code === code)
  expect(match, `service ${code} should be seeded`).toBeTruthy()
  return match.id
}

async function removeBlockoutForDay(page: Page, day: string): Promise<void> {
  try {
    const response = await page.request.get('/api/admin/blockouts')
    if (!response.ok()) return
    const body = await response.json()
    for (const blockout of body.blockouts as { id: string; bookingDate: string }[]) {
      if (blockout.bookingDate === day) {
        await page.request.post(`/api/admin/blockouts/${blockout.id}/delete`)
      }
    }
  } catch {
    // Best-effort cleanup only — a leftover far-future day is harmless.
  }
}

test.describe('studio closures', () => {
  test('BOOKING-011: a blocked day is refused by the desk and the API, then reopened', { tag: '@p1' }, async ({ page }) => {
    const day = farFutureDay()
    const label = formatDay(day)
    const serviceId = await serviceIdByCode(page, 'KARAOKE-MV')

    try {
      await page.goto('/admin/bookings')
      await expect(page.getByRole('heading', { name: 'Blocked days' })).toBeVisible()

      await page.locator('#blockout-date').fill(day)
      await page.locator('#blockout-reason').selectOption('maintenance')
      await page.locator('#blockout-note').fill('E2E maintenance window')
      await page.getByRole('button', { name: 'Block this day' }).click()

      await expect(
        page.getByRole('status').filter({ hasText: `Blocked ${label} (Maintenance).` }),
      ).toBeVisible()
      const listed = page.getByRole('listitem').filter({ hasText: label })
      await expect(listed).toContainText('Maintenance')
      await expect(listed).toContainText('E2E maintenance window')

      // Customer desk: the closure is listed and the date is refused locally.
      await page.goto('/studio/bookings')
      await expect(closures(page)).toContainText(label)
      await expect(closures(page)).toContainText('Maintenance')

      const card = page.getByRole('article').filter({
        has: page.getByRole('heading', { name: /karaoke music video/i }),
      })
      await card.getByRole('button', { name: 'Book this service' }).click()
      await page.getByLabel('Session date').fill(day)
      await expect(page.getByRole('alert')).toContainText(
        'The studio is unavailable on this day (Maintenance)',
      )
      await expect(page.getByRole('button', { name: 'Confirm booking' })).toBeDisabled()

      // Server guard: bypass the disabled button with the same session cookie.
      const blocked = await page.request.post('/api/bookings', {
        data: { serviceId, bookingDate: day, notes: 'E2E blocked-day probe' },
      })
      expect(blocked.status()).toBe(409)
      const blockedBody = await blocked.json()
      expect(blockedBody.error).toContain('unavailable')
      expect(blockedBody.error).toContain('Maintenance')

      // Reopening the day makes the same request succeed.
      await page.goto('/admin/bookings')
      await page.getByRole('button', { name: `Unblock ${label}` }).click()
      await expect(
        page.getByRole('status').filter({ hasText: `Reopened ${label}.` }),
      ).toBeVisible()

      const reopened = await page.request.post('/api/bookings', {
        data: { serviceId, bookingDate: day, notes: 'E2E reopened-day probe' },
      })
      expect(reopened.status()).toBe(201)
      const created = await reopened.json()
      await page.request.post(`/api/bookings/${created.booking.id}/cancel`)
    } finally {
      await removeBlockoutForDay(page, day)
    }
  })

  test('BOOKING-012: a day can be blocked without a reason', { tag: '@p2' }, async ({ page }) => {
    const day = farFutureDay()
    const label = formatDay(day)

    try {
      await page.goto('/admin/bookings')
      await page.locator('#blockout-date').fill(day)
      await page.getByRole('button', { name: 'Block this day' }).click()
      await expect(
        page.getByRole('status').filter({ hasText: `Blocked ${label}.` }),
      ).toBeVisible()

      await page.goto('/studio/bookings')
      const closure = closures(page).getByRole('listitem').filter({ hasText: label })
      await expect(closure).toBeVisible()
      await expect(closure).not.toContainText('—')
    } finally {
      await removeBlockoutForDay(page, day)
    }
  })
})
