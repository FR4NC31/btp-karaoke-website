import { test, expect } from '../fixtures'
import { ADMIN_STORAGE_STATE, ANONYMOUS } from '../helpers/auth'

const publicTitles = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/services', 'Services'],
  ['/contact', 'Contact'],
  ['/signin', 'Sign In'],
  ['/signup', 'Sign Up'],
  ['/not-a-real-page', 'Page Not Found'],
] as const

test.describe('tab titles', () => {
  test.describe('signed out', () => {
    test.use({ storageState: ANONYMOUS })

    test('TITLE-001: public pages set their tab titles', { tag: '@p2' }, async ({ page }) => {
      for (const [path, title] of publicTitles) {
        await page.goto(path)
        await expect(page).toHaveTitle(`${title} | BTP Karaoke`)
      }
    })
  })

  test('TITLE-002: studio pages set their tab titles', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page).toHaveTitle('Studio | BTP Karaoke')

    await page.goto('/studio/profile')
    await expect(page).toHaveTitle('My Account | BTP Karaoke')

    await page.goto('/studio/bookings')
    await expect(page).toHaveTitle('Booking Desk | BTP Karaoke')

    await page.goto('/studio/player-queue')
    await expect(page).toHaveTitle('The Reason | BTP Karaoke')

    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page).toHaveURL('/studio/player-queue')
    await expect(page).toHaveTitle('The Reason | BTP Karaoke')
  })

  test.describe('admin', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE })

    test('TITLE-003: admin pages set their tab titles', { tag: '@p2' }, async ({ page }) => {
      await page.goto('/admin')
      await expect(page).toHaveTitle('Admin Overview | BTP Karaoke')

      await page.goto('/admin/bookings')
      await expect(page).toHaveTitle('Reservations | BTP Karaoke')

      await page.goto('/admin/media')
      await expect(page).toHaveTitle('Media Hub | BTP Karaoke')

      await page.goto('/admin/media/new')
      await expect(page).toHaveTitle('New Media | BTP Karaoke')
    })
  })
})
