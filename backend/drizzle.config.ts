import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit configuration — schema generation only.
 *
 *   cd backend
 *   npx drizzle-kit generate     # writes backend/drizzle/*.sql + snapshot
 *   npm run migrate              # applies them (scripts/migrate.ts)
 *
 * Applying is deliberately NOT `drizzle-kit migrate`: that command opens its
 * own connection, and this project needs the Aiven CA + `sslmode` handling in
 * src/db.ts. scripts/migrate.ts uses the shared pool instead.
 *
 * No `dbCredentials` on purpose — `generate` is offline, and leaving the URL
 * out means no command here can connect and mutate the database by accident.
 * `drizzle-kit studio` would need credentials added back; don't.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
})
