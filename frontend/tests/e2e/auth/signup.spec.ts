import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'

async function fillSignUpForm(page: Page, overrides: Partial<Record<string, string>> = {}) {
  const fields = {
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
    contact: '09171234567',
    password: 'Secret123!',
    confirmPassword: 'Secret123!',
    ...overrides,
  }

  await page.getByLabel('First name').fill(fields.firstName)
  await page.getByLabel('Last name').fill(fields.lastName)
  await page.getByLabel('Email').fill(fields.email)
  await page.getByLabel('Contact number').fill(fields.contact)
  await page.getByLabel('Password', { exact: true }).fill(fields.password)
  await page.getByLabel('Confirm password').fill(fields.confirmPassword)
}

test.describe('registration', () => {
  test('AUTH-010: valid registration reaches the studio', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/signup')
    await fillSignUpForm(page)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
  })

  test('AUTH-011: contact number shorter than 11 digits is rejected', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signup')
    await fillSignUpForm(page, { contact: '0917123456' })
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByRole('alert')).toHaveText('Contact number must be exactly 11 digits')
    await expect(page).toHaveURL('/signup')
  })

  test('AUTH-012: non-digit characters are stripped from contact field', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signup')
    const contact = page.getByLabel('Contact number')
    await contact.fill('091712X3456')
    await expect(contact).toHaveValue('0917123456')
  })

  test('AUTH-013: mismatched passwords are rejected', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signup')
    await fillSignUpForm(page, { confirmPassword: 'Different123!' })
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByRole('alert')).toHaveText('Passwords do not match')
    await expect(page).toHaveURL('/signup')
  })

  test('AUTH-014: validation error clears after correcting contact number', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/signup')
    await fillSignUpForm(page, { contact: '0917' })
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByRole('alert')).toBeVisible()

    await page.getByLabel('Contact number').fill('09171234567')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL('/studio')
  })
})
