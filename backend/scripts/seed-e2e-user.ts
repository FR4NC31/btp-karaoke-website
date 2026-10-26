import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { eq, sql } from 'drizzle-orm'
import { db, pool } from '../src/db/client.ts'
import { user } from '../src/db/schema.ts'
import { requireDisposableDatabase } from './e2e-db-guard.ts'

/**
 * Seeds the shared Playwright user into the disposable PR database.
 *
 * The smoke suite signs in as `qa@example.com`, but the live QA database is
 * where that account normally lives. The PR job must not touch that database,
 * so this creates the same credential locally after migrations run.
 *
 * It writes Better Auth's own credential shape (a `user` row plus an `account`
 * row with providerId "credential") and uses Better Auth's password hasher, so
 * the real sign-in endpoint verifies it exactly like a normal sign-up.
 *
 * Guarded because it writes a known password: it requires E2E_DB_SETUP=1 and a
 * localhost DATABASE_URL, so it cannot touch the live QA database by accident.
 */

requireDisposableDatabase()

const e2eUser = {
  email: 'qa@example.com',
  password: 'Secret123!',
  name: 'QA User',
  firstName: 'QA',
  lastName: 'User',
  contactNum: '+639170000000',
}

try {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, e2eUser.email))
    .limit(1)

  const userId = existing[0]?.id ?? randomUUID()
  const passwordHash = await hashPassword(e2eUser.password)

  await db.transaction(async (tx) => {
    if (!existing[0]) {
      await tx.insert(user).values({
        id: userId,
        name: e2eUser.name,
        email: e2eUser.email,
        emailVerified: false,
        firstName: e2eUser.firstName,
        lastName: e2eUser.lastName,
        contactNum: e2eUser.contactNum,
      })
    }

    const credential = await tx.execute<{ id: string }>(sql`
      select "id"
      from "account"
      where "userId" = ${userId} and "providerId" = 'credential'
      limit 1
    `)

    if (credential.rows[0]) {
      await tx.execute(sql`
        update "account"
        set
          "accountId" = ${userId},
          "password" = ${passwordHash},
          "updatedAt" = now()
        where "id" = ${credential.rows[0].id}
      `)
    } else {
      await tx.execute(sql`
        insert into "account"
          ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
        values
          (${randomUUID()}, ${userId}, 'credential', ${userId}, ${passwordHash}, now(), now())
      `)
    }
  })

  console.log(`E2E user ${e2eUser.email} is ready.`)
} catch (err) {
  console.error('\nE2E user seed failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}

