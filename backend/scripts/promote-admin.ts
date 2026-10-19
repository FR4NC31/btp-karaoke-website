import { asc, eq, sql } from 'drizzle-orm'
import { db, pool } from '../src/db.ts'
import { user } from '../src/schema.ts'

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

try {
  if (list) {
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
    const updated = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(sql`lower(${user.email}) = ${email}`)
      .returning({ email: user.email, role: user.role })

    const row = updated[0]
    if (!row) {
      console.error(`No account found for ${email}. Sign it up first, then re-run.`)
      process.exitCode = 1
    } else {
      console.log(`${row.email} is now '${row.role}'.`)
    }
  }
} catch (err) {
  console.error('\npromote-admin failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
