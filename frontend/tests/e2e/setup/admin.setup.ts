import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { request as apiRequest, test as setup } from '@playwright/test'
import { ADMIN_STORAGE_STATE, TEST_ADMIN, signInAsAdmin } from '../helpers/auth'

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
      const body = await signInResponse.text().catch(() => '')
      throw new Error(
        `QA admin sign-in failed for ${TEST_ADMIN.email} ` +
          `(HTTP ${signInResponse.status()}). TEST_ADMIN_PASSWORD does not match ` +
          'the account stored in the database — the email and password secrets ' +
          'must describe the same account. Either update the TEST_ADMIN_PASSWORD ' +
          'repo secret (and frontend/.env.local) to that account\'s real password, ' +
          'or point TEST_ADMIN_EMAIL at an account you control. Re-seeding a ' +
          'disposable database: cd backend && E2E_DB_SETUP=1 TEST_ADMIN_PASSWORD=' +
          '<password> npm run seed:qa-admin. Body: ' +
          body.slice(0, 200),
      )
    }
    const sessionResponse = await api.get('/api/auth/get-session')
    const session = sessionResponse.ok() ? await sessionResponse.json() : null
    const role: unknown = session?.user?.role

    if (role !== 'admin') {
      promoteToAdmin(TEST_ADMIN.email)
    }

    await signInAsAdmin(page)
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
