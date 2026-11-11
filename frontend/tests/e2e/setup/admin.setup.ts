import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, request as apiRequest, test as setup } from '@playwright/test'
import { ADMIN_STORAGE_STATE, TEST_ADMIN, signInAsAdmin } from '../helpers/auth'

/**
 * The only address `backend/scripts/seed-qa-admin.ts` can create or repair —
 * it is hard-coded there. Used to decide whether the re-seed hint in the
 * sign-in error below would actually help.
 */
const QA_ADMIN_EMAIL = 'qa-admin@example.com'

setup('authenticate as the QA admin', async ({ page, baseURL }) => {
  setup.setTimeout(60_000)

  const api = await apiRequest.newContext({ baseURL })
  try {
    const browserLike = { Origin: baseURL ?? '' }

    await api.post('/api/auth/sign-up/email', {
      headers: browserLike,
      data: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
        name: 'QA Admin',
        first_name: 'QA',
        last_name: 'Admin',
        contact_num: '+639170000001',
      },
    })

    // Sign-up answers 409 for an already-seeded account; that is expected and
    // is NOT what proves the credentials. The sign-in below is, so it is the
    // one that must succeed — otherwise the setup used to sail past a bad
    // password and only surface as a confusing "stayed on /signin" 10s later.
    const signInResponse = await api.post('/api/auth/sign-in/email', {
      headers: browserLike,
      data: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
    })
    if (!signInResponse.ok()) {
      const status = signInResponse.status()
      const body = await signInResponse.text().catch(() => '')
      // Only 401 means "these credentials were checked and rejected". A 429
      // (rate limit) or 5xx fails before Better Auth ever reads the password,
      // so blaming the secret there would send operators to rotate a value
      // that was never wrong — report the status and body instead.
      const diagnosis =
        status === 401
          ? 'TEST_ADMIN_PASSWORD does not match the account stored in the ' +
            'database — TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must ' +
            'describe the same account. Update the TEST_ADMIN_PASSWORD repo ' +
            'secret (and frontend/.env.local) to that account\'s real ' +
            'password, or point TEST_ADMIN_EMAIL at an account you control.' +
            // seed:qa-admin always writes qa-admin@example.com, so it cannot
            // repair whatever address TEST_ADMIN_EMAIL happens to name.
            (TEST_ADMIN.email === QA_ADMIN_EMAIL
              ? ' Re-seeding a disposable database: cd backend && ' +
                'E2E_DB_SETUP=1 TEST_ADMIN_PASSWORD=<password> ' +
                'npm run seed:qa-admin.'
              : '')
          : 'This is not necessarily a credential problem — rate limiting ' +
            'and server errors look the same from here. Check the backend ' +
            'logs before touching the secrets.'
      throw new Error(
        `QA admin sign-in failed for ${TEST_ADMIN.email} (HTTP ${status}). ` +
          `${diagnosis} Body: ${body.slice(0, 200)}`,
      )
    }
    const sessionResponse = await api.get('/api/auth/get-session')
    const session = sessionResponse.ok() ? await sessionResponse.json() : null
    const role: unknown = session?.user?.role

    if (role !== 'admin') {
      promoteToAdmin(TEST_ADMIN.email)
    }

    await signInAsAdmin(page)

    // The admin account may have an incomplete profile (address missing),
    // which surfaces the non-dismissible Required Profile modal on /studio
    // and hides the page from the accessibility tree. Complete it once so
    // the rest of the suite can interact with the studio chrome.
    await page.goto('/studio')
    const modal = page.locator('text=Required Profile Details')
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByLabel('First Name').fill('QA')
      await page.getByLabel('Last Name').fill('Admin')
      await page.getByLabel('Mobile Number').fill('+639170000001')

      const provinceSelect = page.locator('#required-province')
      await provinceSelect.selectOption({ index: 1 })

      const citySelect = page.locator('#required-city')
      await page.waitForFunction(() => (document.querySelector('#required-city') as HTMLSelectElement)?.options.length > 1)
      await citySelect.selectOption({ index: 1 })

      const barangaySelect = page.locator('#required-barangay')
      await page.waitForFunction(() => (document.querySelector('#required-barangay') as HTMLSelectElement)?.options.length > 1)
      await barangaySelect.selectOption({ index: 1 })

      await page.getByRole('button', { name: 'Save & Continue' }).click()
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    }

    await page.context().storageState({ path: ADMIN_STORAGE_STATE })
  } finally {
    await api.dispose()
  }
})

function promoteToAdmin(email: string) {
  const backendDir = [
    resolve(process.cwd(), '..', 'backend'),
    resolve(process.cwd(), 'backend'),
  ].find((candidate) => existsSync(join(candidate, 'scripts', 'promote-admin.ts')))

  if (!backendDir) {
    throw new Error(
      'Could not find backend/scripts/promote-admin.ts. Run the suite from frontend/ ' +
        `(or the repo root), or promote ${email} by hand and re-run.`,
    )
  }

  const output = execFileSync(
    process.execPath,
    ['--env-file=.env', join('scripts', 'promote-admin.ts'), email],
    { cwd: backendDir, encoding: 'utf8' },
  )
  console.log(output.trim())
}
