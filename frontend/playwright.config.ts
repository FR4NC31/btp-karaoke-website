import { existsSync } from 'node:fs'
import { defineConfig, devices, type ReporterDescription } from '@playwright/test'

/**
 * Local-only values (including the QA admin credentials the admin setup signs
 * in with) come from frontend/.env.local, which is gitignored. Trusted CI jobs
 * supply the same variables through the workflow instead. loadEnvFile never
 * overwrites variables that are already set, so an explicit env always wins.
 *
 * The PR smoke job intentionally has no admin credential. When those values
 * are absent, the setup project excludes admin.setup.ts — PR code never
 * receives the admin secret, and the smoke suite still gets its shared user
 * session from auth.setup.ts.
 */
const localEnvFile = new URL('.env.local', import.meta.url)
if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile)

/**
 * Playwright QA / E2E configuration for the BTP Karaoke website.
 *
 * Starts both local development servers automatically (frontend on 5173,
 * backend on 3000) unless a server is already running.
 *
 * Environment variables (never commit secrets; locally they live in
 * frontend/.env.local):
 *   PLAYWRIGHT_BASE_URL        Frontend origin. Defaults to the local Vite
 *                              dev server (http://localhost:5173). A
 *                              non-local origin additionally requires
 *                              PLAYWRIGHT_ALLOW_EXTERNAL=1 so tests can
 *                              never silently run against production.
 *   PLAYWRIGHT_ALLOW_EXTERNAL  Set to 1 to allow a non-local base URL.
 *   BACKEND_BASE_URL           Backend origin. Defaults to
 *                              http://localhost:3000 (used by API probes).
 *   TEST_ADMIN_EMAIL           QA admin account the admin setup signs in as.
 *   TEST_ADMIN_PASSWORD        Its password — repo secret in trusted CI, local
 *                              .env.local elsewhere (see helpers/auth.ts).
 *                              Only the full suite needs these; the PR smoke
 *                              run omits both and skips admin.setup.ts.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
const backendURL = process.env.BACKEND_BASE_URL || 'http://localhost:3000'
const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(baseURL)
const isLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(backendURL)
const hasAdminCredentials = Boolean(
  process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD,
)

if (!isLocalTarget && process.env.PLAYWRIGHT_ALLOW_EXTERNAL !== '1') {
  throw new Error(
    `Refusing to run E2E tests against non-local URL "${baseURL}". ` +
      'Set PLAYWRIGHT_ALLOW_EXTERNAL=1 only if you are certain the target is a safe test environment.',
  )
}

const reporters: ReporterDescription[] = process.env.CI
  ? [['list'], ['html', { open: 'never' }], ['github']]
  : [['list'], ['html', { open: 'never' }]]

// Vite must listen on the port we are about to poll, otherwise the webServer
// waits for a server that will never appear there. --strictPort turns a port
// clash into a fast, clear error instead of a silent move + 60 s timeout.
const frontendPort = new URL(baseURL).port || '5173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  // 60 s: the media editor flows upload real files, read tags, grab video
  // frames and walk several pages — well past 30 s under two parallel workers.
  timeout: 60_000,
  // 10 s: the studio opens behind a session check against the database plus a
  // ~3.5 s skeleton, and both slow down under parallel workers.
  expect: { timeout: 10_000 },
  reporter: reporters,
  outputDir: 'test-results',

  use: {
    baseURL,
    // Evidence policy: full traces/screenshots/videos are only retained for
    // failing tests — passing tests leave no large artifacts behind.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Signs in once and writes playwright/.auth/user.json. Must complete
    // before `chromium` starts, hence the dependency. admin.setup.ts is only
    // part of the setup run when its credential exists: the PR smoke job runs
    // without it, so PR-controlled code never sees the admin secret.
    {
      name: 'setup',
      testMatch: hasAdminCredentials ? /.*\.setup\.ts/ : /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // /studio is guarded, so most suites inherit a live session instead
        // of signing in themselves. Suites that must start signed out opt
        // out with test.use({ storageState: ANONYMOUS }).
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Firefox/WebKit are intentionally not configured: only Chromium is
    // installed for this project. Add projects here after running
    // `npx playwright install firefox webkit` if cross-browser QA is needed.
  ],

  // Local servers only. When PLAYWRIGHT_BASE_URL points elsewhere no local
  // servers are started for that tier.
  webServer: [
    ...(isLocalTarget
      ? [
          {
            command: `npm run dev -- --port ${frontendPort} --strictPort`,
            url: baseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ]
      : []),
    ...(isLocalTarget && isLocalBackend
      ? [
          {
            command: 'npm run dev',
            cwd: '../backend',
            url: `${backendURL}/health`,
            env: { PORT: new URL(backendURL).port || '3000' },
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ]
      : []),
  ],
})
