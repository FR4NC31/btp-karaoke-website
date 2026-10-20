import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const STORAGE_STATE = 'playwright/.auth/user.json'

export const ADMIN_STORAGE_STATE = 'playwright/.auth/admin.json'

export const ANONYMOUS = { cookies: [], origins: [] }

export const TEST_USER = {
  email: 'qa@example.com',
  password: 'Secret123!',
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. The E2E suite needs the QA admin credentials: ` +
        'put TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in frontend/.env.local ' +
        '(see docs/testing/playwright.md), or export them before running.',
    )
  }
  return value
}

export const TEST_ADMIN = {
  email: requiredEnv('TEST_ADMIN_EMAIL'),
  password: requiredEnv('TEST_ADMIN_PASSWORD'),
}

export async function signIn(page: Page, credentials: { email: string; password: string } = TEST_USER) {
  await page.context().clearCookies()
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/studio')
}

export async function signInAsAdmin(page: Page, credentials = TEST_ADMIN) {
  await page.context().clearCookies()
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/admin')
}
