import { asc, eq, sql } from 'drizzle-orm'
import { db, pool } from '../src/db/client.ts'
import { user } from '../src/db/schema.ts'

/**
 * Grants or revokes the admin role for one account.
 *
 *   cd backend
 *   npm run promote-admin -- someone@example.com            # -> role 'admin'
 *   npm run promote-admin -- someone@example.com --revoke   # -> role 'user'
 *   npm run promote-admin -- --list                         # who is an admin?
 *
 * This script is the ONLY way the `user.role` column ever changes. There is
 * deliberately no HTTP endpoint for it: `role` is `input: false` in
 * src/auth.ts, so sign-up and /api/auth/update-user reject client-supplied
 * roles, and no admin API route touches roles at all. Promotion is a manual,
 * auditable act by whoever holds database credentials — the smallest
 * escalation surface this feature can have.
 *
 * The account must already exist. Sign it up through the normal /signup flow
 * first (the person keeps their own password), then promote it here.
 *
 * Requires drizzle/0001_*.sql to have been applied (`npm run migrate`) —
 * that is the migration that adds the column.
 */

const args = process.argv.slice(2)
const email = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase()
const revoke = args.includes('--revoke')
const list = args.includes('--list')

// A mistyped flag must never silently become the opposite operation. Without
// this, `--revok` is not `--revoke`, so an operator asking to revoke would
// promote the account instead — and the output would look like it worked.
const KNOWN_FLAGS = new Set(['--revoke', '--list'])
const unknownFlags = args.filter((arg) => arg.startsWith('--') && !KNOWN_FLAGS.has(arg))

try {
  if (unknownFlags.length > 0) {
    console.error(`Unknown option(s): ${unknownFlags.join(', ')}`)
    console.error('Usage: npm run promote-admin -- <email> [--revoke] [--list]')
    process.exitCode = 1
  } else if (list) {
    const admins = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.role, 'admin'))
      .orderBy(asc(user.name))

    if (admins.length === 0) {
      console.log('No admin accounts yet. Promote one with:')
      console.log('  npm run promote-admin -- someone@example.com')
    } else {
      console.log(`${admins.length} admin account(s):`)
      for (const admin of admins) {
        console.log(`  ${admin.email.padEnd(32)} ${admin.name}`)
      }
    }
  } else if (!email) {
    console.error('Usage: npm run promote-admin -- <email> [--revoke] [--list]')
    process.exitCode = 1
  } else {
    const role = revoke ? 'user' : 'admin'

    // Match the email case-insensitively so the operator does not have to
    // reproduce the exact casing of the sign-up; emails are stored as typed.
    //
    // Look the account up first instead of updating the whole match set: a
    // multi-row UPDATE changes every address that folds to the same value and
    // still reports only the first row, so more than one match aborts.
    const [target, ...others] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(sql`lower(${user.email}) = ${email}`)

    if (!target) {
      console.error(`No account found for ${email}. Sign it up first, then re-run.`)
      process.exitCode = 1
    } else if (others.length > 0) {
      console.error(`${others.length + 1} accounts match ${email} — refusing to change any of them:`)
      for (const match of [target, ...others]) {
        console.error(`  ${match.email}`)
      }
      console.error('Resolve the duplicate accounts manually in the database, then re-run.')
      process.exitCode = 1
    } else {
      const updated = await db
        .update(user)
        .set({ role, updatedAt: new Date() })
        .where(eq(user.id, target.id))
        .returning({ id: user.id })

      if (updated.length === 0) {
        console.error(`${target.email} disappeared before the update — nothing changed.`)
        process.exitCode = 1
      } else {
        console.log(`${target.email} is now '${role}'.`)
      }
    }
  }
} catch (err) {
  console.error('\npromote-admin failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}

