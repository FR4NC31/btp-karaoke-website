import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.ts'

/**
 * The single Postgres connection layer for the whole backend.
 *
 * Extracted from auth.ts so application queries (bookings), migrations and the
 * seed share one connection configuration instead of each building their own —
 * two pools would double the connection count against Aiven's free tier and
 * let the TLS setup drift apart.
 */

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
}

function readCa(): string | undefined {
  const caFile = process.env.DB_CA_FILE
  if (!caFile) return undefined
  return readFileSync(resolve(caFile), 'utf8')
}

const ca = readCa()

/**
 * Removes `sslmode` from the connection string while keeping it well-formed.
 *
 * Stripping the parameter with a blind replace that also consumes the leading
 * `?` leaves a bare `&` behind, so `…?sslmode=require&connect_timeout=10`
 * becomes `…/defaultdb&connect_timeout=10` — the `&` and the parameter after it
 * are then read as part of the database name and every connection fails. Strip
 * the parameter, then repair whichever separator survives.
 */
function withoutSslmode(url: string): string {
  if (!/[?&]sslmode=/.test(url)) return url
  return (
    url
      .replace(/([?&])sslmode=[^&]*/g, '$1')
      // `?sslmode=x&a=1` -> `?&a=1`; promote the first surviving parameter.
      .replace(/\?&/, '?')
      // `?a=1&sslmode=x&b=2` -> `?a=1&&b=2`; close the gap.
      .replace(/&&/g, '&')
      // `?sslmode=x` / `?a=1&sslmode=x`; drop the orphan separator.
      .replace(/[?&]$/, '')
  )
}

// `sslmode` in the connection string overrides the `ssl` object below, which
// silently drops our CA cert and breaks verification. Strip it and configure
// TLS explicitly instead.
const connectionString = ca ? withoutSslmode(databaseUrl) : databaseUrl

export const pool = new Pool({
  connectionString,
  ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
})

// Aiven closes idle connections. pg-pool re-emits that as an `error` event on
// the pool, and an EventEmitter with no listener for `error` turns it into an
// uncaught exception that takes the process down. There is nothing to clean up
// — pg-pool has already dropped the dead client — so logging is the whole job;
// the next query simply gets a fresh connection.
pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message)
})

/**
 * Drizzle query layer over the same pool.
 *
 * Better Auth keeps using `pool` directly (its kysely adapter), so both
 * libraries ride one set of connections. Drizzle owns `service` / `booking`;
 * see src/schema.ts for the ownership split with better-auth_migrations/.
 */
export const db = drizzle(pool, { schema })
