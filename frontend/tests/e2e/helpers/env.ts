/**
 * Central place for non-secret test environment URLs.
 *
 * Defaults match the local development servers started by
 * playwright.config.ts. Override only with environment variables —
 * never hard-code other hosts, and never point at production
 * (playwright.config.ts refuses non-local URLs without an explicit flag).
 */
export const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3000'
