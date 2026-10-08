/**
 * Central place for non-secret test environment URLs.
 *
 * Defaults match the local development servers started by
 * playwright.config.ts. Override only with environment variables —
 * never hard-code other hosts, and never point at production:
 * a non-local BACKEND_BASE_URL requires the same explicit
 * PLAYWRIGHT_ALLOW_EXTERNAL=1 opt-in as playwright.config.ts.
 */

const backendFromEnv = process.env.BACKEND_BASE_URL

if (
  backendFromEnv &&
  !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(backendFromEnv) &&
  process.env.PLAYWRIGHT_ALLOW_EXTERNAL !== '1'
) {
  throw new Error(
    `Refusing to use non-local BACKEND_BASE_URL "${backendFromEnv}". ` +
      'Set PLAYWRIGHT_ALLOW_EXTERNAL=1 only if you are certain the target is a safe test environment.',
  )
}

export const BACKEND_URL = backendFromEnv || 'http://localhost:3000'
