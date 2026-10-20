import { test, expect } from '../fixtures'
import { ANONYMOUS } from '../helpers/auth'


function adminCalls(request: import('@playwright/test').APIRequestContext) {
  return {
    listBookings: request.get('/api/admin/bookings'),
    listUsers: request.get('/api/admin/users?query=qa'),
    createBooking: request.post('/api/admin/bookings', {
      data: {
        guestName: 'SEC probe',
        serviceId: 'svc_does_not_matter',
        bookingDate: '2030-01-01',
      },
    }),
    mutateBooking: request.post('/api/admin/bookings/does-not-exist/confirm'),
  }
}

test.describe('admin API (signed out)', () => {
  test.use({ storageState: ANONYMOUS })

  test('SEC-001: every admin endpoint answers 401 without a session', { tag: '@p1' }, async ({ request }) => {
    const calls = adminCalls(request)

    for (const response of await Promise.all(Object.values(calls))) {
      expect(response.status()).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    }
  })
})

test.describe('admin API (regular user)', () => {

  test('SEC-002: a signed-in non-admin gets 403 and no data anywhere', { tag: '@p1' }, async ({ request }) => {
    const calls = adminCalls(request)

    for (const response of await Promise.all(Object.values(calls))) {
      expect(response.status()).toBe(403)
      expect(await response.json()).toEqual({ error: 'Forbidden' })
    }
  })
})

test.describe('privilege escalation attempts', () => {
  test.use({ storageState: ANONYMOUS })

  test('SEC-003: role cannot be set at sign-up or through update-user', { tag: '@p1' }, async ({ request, baseURL }) => {
    const email = `qa-role-probe-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`

    const signUp = await request.post('/api/auth/sign-up/email', {
      headers: { Origin: baseURL ?? '' },
      data: {
        email,
        password: 'Probe123!',
        name: 'Role Probe',
        first_name: 'Role',
        last_name: 'Probe',
        contact_num: '+639170000002',
        role: 'admin',
      },
    })
    expect(signUp.ok()).toBeTruthy()
    const created = await signUp.json()
    expect(created.user.role).toBe('user')

    const update = await request.post('/api/auth/update-user', {
      headers: { Origin: baseURL ?? '' },
      data: { name: 'Role Probe II', role: 'admin' },
    })
    expect(update.status()).toBe(400)

    const session = await request.get('/api/auth/get-session')
    const sessionBody = await session.json()
    expect(sessionBody.user.role).toBe('user')
  })
})

test.describe('admin console route guard (UI)', () => {

  test('SEC-004: a signed-in non-admin is bounced back to the studio', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL('/studio')

    const topBar = page.getByRole('banner')
    await expect(topBar.getByRole('link', { name: 'Bookings' })).toBeVisible()
    await expect(topBar.getByRole('link', { name: 'Admin Console' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeHidden()
  })

  test.describe('signed out', () => {
    test.use({ storageState: ANONYMOUS })

    test('SEC-005: a signed-out visitor is sent to sign-in, remembering /admin', { tag: '@p2' }, async ({ page }) => {
      await page.goto('/admin')

      await expect(page).toHaveURL(/\/signin\?next=%2Fadmin/)
    })
  })
})

test.describe('post-sign-in redirect target', () => {
  const craftedNextTargets: Array<[string, string]> = [
    ['%2F%0A%2F%2Fevil.example', 'the reported payload: "/" LF "//evil"'],
    ['%2F%0A%2Fevil.example', 'a single slash after the LF'],
    ['%2F%0D%2Fevil.example', 'CR instead of LF'],
    ['%2F%09%2Fevil.example', 'TAB instead of LF'],
    ['%2F%00%2Fevil.example', 'NUL'],
    ['%2F%2Fevil.example', 'plain protocol-relative'],
    ['%2F%5Cevil.example', 'backslash'],
  ]

  test('SEC-006: a crafted ?next= lands safely instead of breaking the page', { tag: '@p1' }, async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    for (const [payload, label] of craftedNextTargets) {
      pageErrors.length = 0
      await page.goto(`/signin?next=${payload}`)

      await expect(page, `${label}: did not land on the studio`).toHaveURL('/studio')
      expect(pageErrors, `${label}: the route threw instead of navigating`).toEqual([])
    }
  })

  test('SEC-007: a legitimate ?next= still lands where it asked', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/signin?next=%2Fstudio%2Fbookings')

    await expect(page).toHaveURL('/studio/bookings')
  })
})
