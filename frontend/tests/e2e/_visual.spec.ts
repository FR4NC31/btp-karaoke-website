import { test } from '@playwright/test'
import { ANONYMOUS } from './helpers/auth'

test.use({ storageState: ANONYMOUS, viewport: { width: 1600, height: 1000 } })

const now = Date.now()
const day = new Date().toISOString().slice(0, 10)
const iso = (msAgo: number) => new Date(now - msAgo).toISOString()

function booking(id: string, status: string, name: string, service: string, price: number, msAgo: number) {
  return {
    id,
    referenceCode: `BTP-${id.toUpperCase()}00`,
    serviceId: 's1',
    serviceCode: 'STUDIO-TRACKING',
    serviceName: service,
    serviceUnit: 'per day',
    pricePhp: price,
    amountDuePhp: Math.round(price * 0.9),
    discountPercent: 10,
    bookingDate: day,
    bookingTime: '11:00:00',
    status,
    notes: 'Suite B · Solid State console · 8-hour lockout',
    paymentMethod: 'gcash',
    receiptUrl: null,
    createdAt: iso(msAgo),
    userId: 'u1',
    guestName: null,
    customerName: name,
    customerEmail: 'mark@example.ph',
    customerContact: '+639171234567',
  }
}

const bookings = [
  booking('a1', 'pending', 'Mark Buclista', 'Album Tracking Session', 8500, 4 * 60_000),
  booking('a2', 'confirmed', 'Patricia Reyes', 'VIP Karaoke Night', 4500, 42 * 60_000),
  booking('a3', 'completed', 'QA Admin', 'Music Video Production', 25000, 6 * 3_600_000),
]

const blockouts = [
  {
    id: 'b1',
    bookingDate: new Date(now + 86_400_000).toISOString().slice(0, 10),
    reason: 'maintenance',
    note: 'Console servicing',
    createdAt: iso(0),
  },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/get-session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: 's1',
          token: 't',
          userId: 'admin-1',
          expiresAt: new Date(now + 86_400_000).toISOString(),
        },
        user: {
          id: 'admin-1',
          email: 'admin@btpkaraoke.ph',
          name: 'Franc Ramos',
          first_name: 'Franc',
          last_name: 'Ramos',
          role: 'admin',
          emailVerified: true,
          image: null,
          createdAt: iso(0),
          updatedAt: iso(0),
        },
      }),
    }),
  )
  await page.route('**/api/admin/bookings*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ bookings, studioToday: day }),
    }),
  )
  await page.route('**/api/admin/blockouts*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ blockouts, studioToday: day }),
    }),
  )
  await page.route('**/api/admin/users*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [{ id: 'u1', name: 'Mark Buclista', email: 'mark@example.ph' }],
      }),
    }),
  )
})

test('admin pages', async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('heading', { name: 'Admin Dashboard', level: 1 }).waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'C:/Users/poki/AppData/Local/Temp/opencode/admin-overview.png',
    fullPage: true,
  })

  await page.getByRole('link', { name: 'Blocked Days', exact: true }).click()
  await page.getByRole('heading', { name: 'Blocked Days', level: 1 }).waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({
    path: 'C:/Users/poki/AppData/Local/Temp/opencode/admin-blocked-days.png',
    fullPage: true,
  })

  await page.getByRole('link', { name: 'Membership', exact: true }).click()
  await page.getByRole('heading', { name: 'Memberships', level: 1 }).waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({
    path: 'C:/Users/poki/AppData/Local/Temp/opencode/admin-memberships.png',
    fullPage: true,
  })
})
