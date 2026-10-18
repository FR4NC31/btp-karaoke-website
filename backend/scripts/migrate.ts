import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from '../src/db.ts'

/**
 * Applies `backend/drizzle/*.sql` through Drizzle's own migrator, which tracks
 * what has run in the `drizzle.__drizzle_migrations` table.
 *
 *   cd backend
 *   npm run db:generate        # schema.ts -> a new .sql file (offline)
 *   npm run migrate            # apply pending .sql files
 *   npm run migrate -- --status  # list them and what has been applied
 *   npm run seed               # (re)load the sample service catalog
 *
 * Deliberately NOT `drizzle-kit migrate`: that opens its own connection and
 * would bypass the Aiven CA + `sslmode` handling in src/db.ts.
 *
 * Scope: this only creates the tables Drizzle owns (service, booking). The
 * Better Auth tables come from `bun x auth@latest migrate` and are referenced, never
 * created, from here.
 */

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle')
const wantsStatus = process.argv.includes('--status')

/**
 * Hashes of the migrations already applied. The ledger table lives in the
 * `drizzle` schema and does not exist until the first migration runs, so a
 * missing table means an empty database rather than an error.
 */
async function appliedHashes(): Promise<Set<string>> {
  try {
    const result = await db.execute<{ hash: string }>(
      sql`select hash from drizzle.__drizzle_migrations`,
    )
    return new Set(result.rows.map((row) => row.hash))
  } catch {
    return new Set()
  }
}

async function printStatus() {
  const files = readMigrationFiles({ migrationsFolder })
  const applied = await appliedHashes()

  console.log(`Migrations in ${migrationsFolder}:\n`)
  for (const file of files) {
    const mark = applied.has(file.hash) ? 'applied' : 'PENDING'
    const name = file.sql[0]?.trim().split('\n')[0] ?? '(empty)'
    console.log(`  ${mark.padEnd(8)} idx ${String(file.folderMillis).padEnd(15)} ${name}`)
  }

  const pending = files.filter((file) => !applied.has(file.hash)).length
  console.log(
    `\n${files.length} migration(s): ${files.length - pending} applied, ${pending} pending.`,
  )
}

try {
  if (wantsStatus) {
    await printStatus()
  } else {
    console.log(`Applying migrations from ${migrationsFolder} ...`)
    await migrate(db, { migrationsFolder })
    console.log('Migrations applied — database is up to date.')
  }
} catch (err) {
  console.error('\nMigration failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
