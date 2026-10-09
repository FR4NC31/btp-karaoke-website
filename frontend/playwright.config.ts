import { defineConfig, devices, type ReporterDescription } from '@playwright/test'

/**
 * Playwright QA / E2E configuration for the BTP Karaoke website.
 *
 * Starts both local development servers automatically (frontend on 5173,
 * backend on 3000) unless a server is already running.
 *
 * Environment variables (never put secrets here):
 *   PLAYWRIGHT_BASE_URL        Frontend origin. Defaults to the local Vite
 *                              dev server (http://localhost:5173). A
 *                              non-local origin additionally requires
 *                              PLAYWRIGHT_ALLOW_EXTERNAL=1 so tests can
 *                              never silently run against production.
 *   PLAYWRIGHT_ALLOW_EXTERNAL  Set to 1 to allow a non-local base URL.
 *   BACKEND_BASE_URL           Backend origin. Defaults to
 *                              http://localhost:3000 (used by API probes).
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
const backendURL = process.env.BACKEND_BASE_URL || 'http://localhost:3000'
const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(baseURL)
const isLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(backendURL)

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
  timeout: 30_000,
  expect: { timeout: 5_000 },
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
    // before `chromium` starts, hence the dependency.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
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
