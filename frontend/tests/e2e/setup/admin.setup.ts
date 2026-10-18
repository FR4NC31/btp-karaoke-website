import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { request as apiRequest, test as setup } from '@playwright/test'
import { ADMIN_STORAGE_STATE, TEST_ADMIN, signInAsAdmin } from '../helpers/auth'

/**
 * Admin-session setup — the twin of auth.setup.ts.
 *
 * Gives the admin suites a live `role = 'admin'` session without them paying
 * for (or having to replicate) the promotion dance:
 *
 *   1. ensure the account exists in Aiven (sign up through the API; the
 *      "already registered" failure is the common case and is ignored);
 *   2. read the role back through the real session endpoint, and if the
 *      account is not promoted yet, run the only promotion path that exists —
 *      `backend/scripts/promote-admin.ts`, directly against the database.
 *      This mirrors the deployment story: no HTTP route can grant the role
 *      (SEC-003 asserts that), so the setup reaches for the same CLI an
 *      operator would;
 *   3. sign in through the real UI form and snapshot the cookie into
 *      ADMIN_STORAGE_STATE. The sign-in helper asserts the /admin landing,
 *      which also exercises the role-aware post-sign-in redirect.
 *
 * Steps 1–2 are idempotent: on a database where the account is already
 * promoted (the normal case after the first run) the only cost is the role
 * check. If sign-in later fails with "Incorrect email or password", the
 * account predates these credentials — reset the password or delete the row,
 * then re-run.
 */
setup('authenticate as the QA admin', async ({ page, baseURL }) => {
  setup.setTimeout(60_000)

  const api = await apiRequest.newContext({ baseURL })
  try {
    // Requests carry an Origin header because a browser would: Better Auth's
    // fetch-metadata CSRF middleware demands it on credentialed POSTs, and
    // modern HTTP clients (including Playwright's) send sec-fetch-mode, which
    // triggers that check even on a fresh session.
    const browserLike = { Origin: baseURL ?? '' }

    // 1. Ensure the account exists. A 4xx here means "already registered" —
    //    both outcomes end with the account ready to sign in.
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

    // 2. Settle the role. get-session reads the user row fresh, so this is
    //    the same value `requireAdmin` enforces on the API.
    await api.post('/api/auth/sign-in/email', {
      headers: browserLike,
      data: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
    })
    const sessionResponse = await api.get('/api/auth/get-session')
    const session = sessionResponse.ok() ? await sessionResponse.json() : null
    const role: unknown = session?.user?.role

    if (role !== 'admin') {
      promoteToAdmin(TEST_ADMIN.email)
    }

    // 3. Sign in through the UI and snapshot the session.
    await signInAsAdmin(page)
    await page.context().storageState({ path: ADMIN_STORAGE_STATE })
  } finally {
    await api.dispose()
  }
})

/**
 * Runs the promotion CLI against the development database — the same command
 * backend/README.md documents:
 *
 *   cd backend && npm run promote-admin -- qa-admin@example.com
 *
 * Located relative to the repo, not the shell's cwd: the config is normally
 * run from frontend/, but allow a repo-root invocation too. Node >= 22.18
 * (what the backend requires) strips the TypeScript on its own.
 */
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
