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
    await expect(page.getByText(TEST_USER.email)).toBeVisible()
    await expect(page.getByText('Quezon City, Metro Manila')).toBeVisible()
  })

  test('PROFILE-002: account and user profile tabs switch panels', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/profile')

    await expect(page.getByRole('heading', { name: 'Singing & Audio Preferences' })).toBeVisible()

    await page.getByRole('button', { name: 'User Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Public Profile' })).toBeVisible()

    await page.getByRole('button', { name: 'My Account' }).click()
    await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible()
  })
})
