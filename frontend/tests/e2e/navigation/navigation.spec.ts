import { test, expect } from '../fixtures'

test.describe('navigation', () => {
  test('NAV-001: header links reach sign in and sign up', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Sign In' }).first().click()
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await page.goBack()
    await page.getByRole('link', { name: 'Sign Up' }).first().click()
    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
  })

  test('NAV-002: auth pages cross-link to each other', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/signin')

    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/signup')
  })

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('NAV-003: hamburger menu opens, navigates and closes', { tag: '@p1' }, async ({ page }) => {
      await page.goto('/')

      const hamburger = page.getByRole('button', { name: 'Open menu' })
      await expect(hamburger).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden()

      await hamburger.click()
      const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
      await expect(mobileNav).toBeVisible()
      await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible()

      await mobileNav.getByRole('link', { name: 'Sign In' }).click()
      await expect(page).toHaveURL('/signin')

      await page.goto('/')
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Home' }).click()
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden()
    })
  })
})
