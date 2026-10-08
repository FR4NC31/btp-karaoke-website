import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dash } from '@better-auth/infra'
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

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

export const auth = betterAuth({
  database: new Pool({
    connectionString,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      first_name: {
        type: 'string',
        required: true,
      },
      last_name: {
        type: 'string',
        required: true,
      },
      contact_num: {
        type: 'string',
        required: true,
      },
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    // ngrok and any other hosts you want to verify from
    ...(process.env.EXTRA_TRUSTED_ORIGINS?.split(',').map((o) => o.trim()) ?? []),
    // Better Auth Dash verifies server ownership from its dashboard
    'https://dash.better-auth.com',
  ],
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
})
