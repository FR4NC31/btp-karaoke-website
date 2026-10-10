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
      // Google's OIDC profile carries `given_name`/`family_name`, but never
      // our `first_name`/`last_name`/`contact_num`. Those three are
      // `required: true` below and NOT NULL in the migration, and Better Auth
      // validates them while *creating* the user — before any user hook runs —
      // so without this mapping every first-time Google sign-up dies with
      // "first_name is required" and the callback reports
      // "unable_to_create_user".
      mapProfileToUser: (profile) => ({
        first_name: profile.given_name ?? '',
        last_name: profile.family_name ?? '',
        // Google exposes no phone claim for the scopes we request, so leave it
        // blank rather than invent a value. ProfilePage renders "Not set".
        contact_num: '',
      }),
    },
  },
  // Policy: one identity per sign-in method — no implicit account linking.
  //
  // A Google sign-in whose email already has a password account is refused
  // rather than merged. Better Auth 302s back to /signin?error=account_not_linked
  // and the UI tells the person to sign in with the password they registered
  // with (see OAUTH_MESSAGES in frontend/src/lib/auth-errors.ts).
  //
  // Better Auth enforces this by default, through `requireLocalEmailVerified`,
  // and that default matters more than it looks here: nothing ever sets
  // emailVerified=true locally, because there is no SMTP or verification flow.
  // Password users therefore sit at false while Google users arrive at true.
  // Merging on Google's claim alone would let anyone pre-register a victim's
  // email without proving ownership of it, then hold on to password access
  // once the real owner links their Google account — an account takeover.
  //
  // If linking is ever wanted, this is the toggle, with that risk accepted:
  //
  //   account: {
  //     accountLinking: {
  //       enabled: true,
  //       trustedProviders: ['google'],
  //       requireLocalEmailVerified: false,
  //     },
  //   },
  //
  // The sound route instead is real email verification
  // (emailAndPassword.requireEmailVerification plus a Resend/SMTP sender), so
  // a local email is proven before anything is allowed to merge into it.
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
