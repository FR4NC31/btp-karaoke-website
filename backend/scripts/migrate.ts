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
 * What the ledger knows: every recorded hash, and the newest `created_at`.
 *
 * The ledger table lives in the `drizzle` schema and does not exist until the
 * first migration runs, so a missing table means an empty database rather than
 * an error — and that is the *only* failure worth swallowing. A connection,
 * TLS or permission error has to surface: treating those as "empty ledger"
 * made `--status` print every migration as pending and still exit 0 while the
 * database was unreachable, which is worse than no output at all.
 */
async function readLedger(): Promise<{ hashes: Set<string>; lastCreatedAt: number | null }> {
  try {
    const result = await db.execute<{ hash: string; created_at: string | number }>(
      sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at`,
    )
    const rows = result.rows
    const newest = rows[rows.length - 1]
    return {
      hashes: new Set(rows.map((row) => row.hash)),
      lastCreatedAt: newest ? Number(newest.created_at) : null,
    }
  } catch (err) {
    if (isMissingLedgerTable(err)) return { hashes: new Set(), lastCreatedAt: null }
    throw err
  }
}

/** Postgres `undefined_table` — the only error that means "no migrations yet". */
function isMissingLedgerTable(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === '42P01'
}

async function printStatus() {
  const files = readMigrationFiles({ migrationsFolder })
  const { hashes, lastCreatedAt } = await readLedger()

  // The migrator picks work by timestamp, not by hash: it reads the newest
  // ledger row's `created_at` and applies every file whose `folderMillis` is
  // greater (drizzle-orm pg-core/dialect). A file at or below that mark is
  // therefore already accounted for even if its hash never reached the ledger,
  // and calling it PENDING would promise a run that `migrate` will skip.
  const isApplied = (file: { hash: string; folderMillis: number }) =>
    hashes.has(file.hash) || (lastCreatedAt !== null && file.folderMillis <= lastCreatedAt)

  console.log(`Migrations in ${migrationsFolder}:\n`)
  for (const file of files) {
    const mark = isApplied(file) ? 'applied' : 'PENDING'
    // `folderMillis` is the journal timestamp, so show it as a date; the first
    // line of SQL does not identify a migration (0000 opens with
    // `CREATE TABLE "booking" (`, which every table-creating file resembles).
    const when = new Date(file.folderMillis).toISOString().slice(0, 19).replace('T', ' ')
    const name = file.sql[0]?.trim().split('\n')[0] ?? '(empty)'
    console.log(`  ${mark.padEnd(8)} ${when}  ${name}`)
  }

  const pending = files.filter((file) => !isApplied(file)).length
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
