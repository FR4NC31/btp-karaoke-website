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
