import { test, expect } from '../fixtures'

test.describe('profile', () => {
  test('PROFILE-001: profile menu opens the redesigned profile page', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')

    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Profile', exact: true }).click()

    await expect(page).toHaveURL('/studio/profile')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('@qa')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Share Profile' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Bookings/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Favorites' })).toBeVisible()
  })

  test('PROFILE-002: Favorites / Playlists / History tabs switch panels', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio/profile')

    const favorites = page.getByRole('tab', { name: 'Favorites' })
    const playlists = page.getByRole('tab', { name: 'Playlists' })
    const history = page.getByRole('tab', { name: 'History' })

    await expect(favorites).toHaveAttribute('aria-selected', 'true')

    await playlists.click()
    await expect(playlists).toHaveAttribute('aria-selected', 'true')
    await expect(favorites).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByRole('tabpanel', { name: 'Playlists' })).toBeVisible()

    await history.click()
    await expect(history).toHaveAttribute('aria-selected', 'true')
    await expect(playlists).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByRole('tabpanel', { name: 'History' })).toBeVisible()
  })
})
