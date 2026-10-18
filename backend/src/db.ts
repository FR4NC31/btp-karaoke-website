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

// `sslmode` in the connection string overrides the `ssl` object below,
// which silently drops our CA cert and breaks verification. Strip it and
// configure TLS explicitly instead.
const connectionString = ca ? databaseUrl.replace(/[?&]sslmode=[^&]*/, '') : databaseUrl

export const pool = new Pool({
  connectionString,
  ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
})

/**
 * Drizzle query layer over the same pool.
 *
 * Better Auth keeps using `pool` directly (its kysely adapter), so both
 * libraries ride one set of connections. Drizzle owns `service` / `booking`;
 * see src/schema.ts for the ownership split with better-auth_migrations/.
 */
export const db = drizzle(pool, { schema })
