import { test, expect } from '../fixtures'
import { TEST_USER } from '../helpers/auth'

test.describe('profile', () => {
  test('PROFILE-001: profile menu opens the account page', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')

    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Profile', exact: true }).click()

    await expect(page).toHaveURL('/studio/profile')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible()
    await expect(page.getByText(TEST_USER.email)).toBeVisible()
  })

  test('PROFILE-002: account and user profile tabs switch panels', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/profile')

    await expect(page.getByRole('heading', { name: 'Singing & Audio Preferences' })).toBeVisible()

    await page.getByRole('button', { name: 'User Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Public Profile' })).toBeVisible()

    await page.getByRole('button', { name: 'My Account' }).click()
    await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible()
  })

  test('PROFILE-003: location cascades province to city to barangay', { tag: '@p2' }, async ({ page, baseURL }) => {
    // This suite shares one QA account. Keep the location that was there before
    // the test and put it back afterwards, even when an assertion fails.
    const sessionResponse = await page.request.get('/api/auth/get-session')
    expect(sessionResponse.ok()).toBeTruthy()
    const session = await sessionResponse.json()
    const original = {
      province: typeof session?.user?.province === 'string' ? session.user.province : null,
      city_municipality:
        typeof session?.user?.city_municipality === 'string'
          ? session.user.city_municipality
          : null,
      barangay: typeof session?.user?.barangay === 'string' ? session.user.barangay : null,
    }

    try {
      await page.route('https://psgc.gitlab.io/api/**', async (route) => {
        const url = route.request().url()

        if (url.endsWith('/provinces/')) {
          return route.fulfill({
            json: [
              { code: '042100000', name: 'Cavite' },
              { code: '130000000', name: 'Metro Manila (NCR)' },
            ],
          })
        }

        if (url.includes('/provinces/042100000/cities-municipalities/')) {
          return route.fulfill({
            json: [
              { code: '042103000', name: 'City of Bacoor' },
              { code: '042119000', name: 'City of Tagaytay' },
            ],
          })
        }

        if (url.includes('/cities-municipalities/042103000/barangays/')) {
          return route.fulfill({
            json: [
              { code: '042103001', name: 'Molino I' },
              { code: '042103002', name: 'Molino II' },
            ],
          })
        }

        return route.fulfill({ status: 404, json: [] })
      })

      await page.goto('/studio/profile')
      await page.getByRole('button', { name: /(Add|Edit) location/ }).click()

      await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible()

      await page.getByLabel('Province').selectOption('042100000')
      await expect(page.getByLabel('City / Municipality')).toBeEnabled()
      await page.getByLabel('City / Municipality').selectOption('042103000')
      await expect(page.getByLabel('Barangay')).toBeEnabled()
      await page.getByLabel('Barangay').selectOption('042103001')

      await expect(page.getByRole('button', { name: 'Save location' })).toBeEnabled()
      await page.getByRole('button', { name: 'Save location' }).click()

      await expect(page.getByText('Location saved')).toBeVisible()
      await expect(page.getByText('Molino I', { exact: true })).toBeVisible()

      // The three names go through Better Auth into the user row; a reload must
      // read them back from the session, not from local component state.
      await page.reload()
      await expect(page.getByText('Molino I', { exact: true })).toBeVisible()
      await expect(page.getByText('City of Bacoor', { exact: true })).toBeVisible()
      await expect(page.getByText('Cavite', { exact: true })).toBeVisible()
    } finally {
      // The API only accepts a complete location set, so a partial legacy row
      // cannot be written back exactly. Clear it rather than leave the test
      // values behind. Keep a failed restore soft so the cascade assertion is
      // still the primary error.
      const complete = Boolean(original.province && original.city_municipality && original.barangay)
      const restore = complete
        ? original
        : { province: null, city_municipality: null, barangay: null }
      const response = await page.request.post('/api/auth/update-user', {
        data: restore,
        headers: { Origin: baseURL ?? 'http://localhost:5173' },
      })
      expect.soft(response.ok(), await response.text()).toBeTruthy()
    }
  })
})
