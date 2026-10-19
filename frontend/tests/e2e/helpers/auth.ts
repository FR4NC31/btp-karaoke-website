import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Where the shared authenticated session is written by setup/auth.setup.ts
 * and read back by the `chromium` project (see playwright.config.ts).
 *
 * Gitignored — it is a per-run artifact holding a live session cookie.
 */
export const STORAGE_STATE = 'playwright/.auth/user.json'

/**
 * Same idea as STORAGE_STATE, for the admin console. Written by
 * setup/admin.setup.ts; suites that open /admin declare
 * `test.use({ storageState: ADMIN_STORAGE_STATE })`.
 */
export const ADMIN_STORAGE_STATE = 'playwright/.auth/admin.json'

/**
 * `test.use({ storageState: ANONYMOUS })` opts a suite out of the shared
 * session above. Required for anything that drives the sign-in or sign-up
 * form itself: starting those tests already authenticated would make them
 * pass for the wrong reason.
 */
export const ANONYMOUS = { cookies: [], origins: [] }

/**
 * Controlled test credentials backed by a real account in Aiven.
 *
 * This user is seeded once into the database and reused across runs, so
 * sign-in tests exercise the actual backend credential check. If sign-in
 * starts failing with "Incorrect email or password", re-seed the account:
 *
 *   POST /api/auth/sign-up/email  with the values below plus
 *   first_name/last_name/contact_num (all required by the user table).
 */
export const TEST_USER = {
  email: 'qa@example.com',
  password: 'Secret123!',
}

/**
 * Controlled admin credentials, same contract as TEST_USER — a real account
 * with `role = 'admin'` in Aiven, created once and reused.
 *
 * The password is deliberately **not** in this file: it is supplied through
 * the environment. Locally that is `frontend/.env.local` (gitignored, loaded
 * by playwright.config.ts); in CI it is the `TEST_ADMIN_PASSWORD` repo
 * secret. Rotating the password means updating both places, nothing here.
 *
 * Unlike TEST_USER this account cannot be (re)seeded through the sign-up API
 * alone: the role is server-managed (`input: false`), so promotion is a CLI
 * step. setup/admin.setup.ts performs both automatically when they are
 * missing — sign up through the API, then
 *
 *   cd backend && npm run promote-admin -- qa-admin@example.com
 *
 * The role check is part of the security model (see admin-security.spec.ts,
 * SEC-003): there is deliberately no HTTP route that can promote anyone.
 */
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

/**
 * Signs in through the real UI form and waits for the studio.
 *
 * Clears the context's cookies first. `/signin` is a guest-only route now, so
 * an inherited session would bounce the page straight to /studio and the form
 * would never appear — starting from a signed-out state is part of this
 * helper's contract, which also means suites can call it without first having
 * to reason about their own `storageState`.
 *
 * Used by the auth suites and by `setup/auth.setup.ts`, which snapshots the
 * resulting cookie into STORAGE_STATE. Other suites never call this — they
 * inherit the shared session from the `chromium` project, so they can open
 * /studio directly even though the route is now guarded.
 */
export async function signIn(page: Page, credentials: { email: string; password: string } = TEST_USER) {
  await page.context().clearCookies()
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/studio')
}

/**
 * The admin twin of `signIn`: same real UI form, but the post-sign-in
 * destination is /admin. That difference is itself the assertion — the form
 * routes by role (SignInForm calls `landingPathFor`), so reaching /admin here
 * proves both the fresh session read and the role-aware redirect.
 *
 * Clearing cookies matters even more than in `signIn`: /signin is a guest-only
 * route, and an inherited *admin* session would bounce straight to /admin and
 * never show the form.
 */
export async function signInAsAdmin(page: Page, credentials = TEST_ADMIN) {
  await page.context().clearCookies()
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/admin')
}
