import { existsSync } from 'node:fs'
import { defineConfig, devices, type ReporterDescription } from '@playwright/test'

const localEnvFile = new URL('.env.local', import.meta.url)
if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile)

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

const frontendPort = new URL(baseURL).port || '5173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: reporters,
  outputDir: 'test-results',

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

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
