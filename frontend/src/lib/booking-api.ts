import type { Booking } from './types'

/** @deprecated Use a proper HTTP client (e.g. fetch-based wrapper) instead. */
export function request(path: string, options: RequestInit = {}) {
  const url = `/api${path}`
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  })
  return fetch(url, {
    ...options,
    headers,
  })
}

export function isTimeBasedService(unit: string): boolean {
  return /\b(hour|hr)\b/.test(unit.toLowerCase())
}