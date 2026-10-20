import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/db.ts'
import { requireDisposableDatabase } from './e2e-db-guard.ts'

/**
 * Applies the checked-in Better Auth SQL migrations to a fresh database.
 *
 * `bun x auth@latest migrate` is the normal developer path, but the PR E2E job
 * needs to build a disposable database without downloading the Better Auth CLI.
 * The files in better-auth_migrations/ are already generated and reviewed, so
 * applying them directly is deterministic.
 *
 * Guarded because this is a test-database bootstrap, not a deploy tool: it
 * requires E2E_DB_SETUP=1 and a localhost DATABASE_URL. Running it twice will
 * fail on the first `create table`, which is the desired refusal to touch a
 * live one.
 */

requireDisposableDatabase()

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'better-auth_migrations')
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()

try {
  for (const file of files) {
    const migration = readFileSync(join(migrationsDir, file), 'utf8')
    await pool.query(migration)
    console.log(`Applied Better Auth migration ${file}.`)
  }
} catch (err) {
  console.error('\nBetter Auth migration failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
