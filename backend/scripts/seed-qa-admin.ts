import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { eq, sql } from 'drizzle-orm'
import { db, pool } from '../src/db/client.ts'
import { user } from '../src/db/schema.ts'

const adminUser = {
  email: 'qa-admin@example.com',
  password: 'Secret123!',
  name: 'QA Admin',
  firstName: 'QA',
  lastName: 'Admin',
  contactNum: '+639170000001',
  role: 'admin',
}

try {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, adminUser.email))
    .limit(1)

  const userId = existing[0]?.id ?? randomUUID()
  const passwordHash = await hashPassword(adminUser.password)

  await db.transaction(async (tx) => {
    if (!existing[0]) {
      await tx.insert(user).values({
        id: userId,
        name: adminUser.name,
        email: adminUser.email,
        emailVerified: true,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        contactNum: adminUser.contactNum,
        role: adminUser.role,
      })
    } else {
      await tx
        .update(user)
        .set({ role: adminUser.role, updatedAt: new Date() })
        .where(eq(user.id, userId))
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

  console.log(`QA Admin user ${adminUser.email} seeded successfully.`)
} catch (err) {
  console.error('\nQA Admin seed failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
