import { dash } from '@better-auth/infra'
import { betterAuth } from 'better-auth'
import type { User } from 'better-auth'
import { APIError } from 'better-auth/api'
import { resolveAuthNetworkSettings } from './auth-settings.ts'
import { pool } from './db.ts'
import { validateLocationUpdate } from './location.ts'

const { frontendOrigin, ipAddressHeaders, trustedProxies, errorURL } =
  resolveAuthNetworkSettings()

type UserInput = Partial<User> & Record<string, unknown>

/**
 * The location editor sends all three PSGC names together. Keep that contract
 * at the API boundary too: both sign-up and update-user accept additional
 * fields from the client, so neither may write a partial, blank, or unbounded
 * location row.
 */
async function guardLocation(user: UserInput) {
  const location = validateLocationUpdate(user)

  if (location.kind === 'invalid') {
    throw new APIError('BAD_REQUEST', { message: location.message })
  }

  if (location.kind === 'valid') {
    return { data: { ...user, ...location.data } }
  }
}

export const auth = betterAuth({
  // Shared pool (see db.ts) so auth and the booking queries ride the same
  // connections and TLS setup.
  database: pool,
  databaseHooks: {
    user: {
      create: { before: guardLocation },
      update: { before: guardLocation },
    },
  },
  // Rate-limit buckets are keyed by client IP. Behind a proxy/CDN the socket
  // address is the edge, so read the address header the edge overwrites.
  // AUTH_IP_ADDRESS_HEADERS / AUTH_TRUSTED_PROXIES are validated in
  // auth-settings.ts; see docs/auth/proxy-and-oauth-errors.md for deployment
  // examples and spoofing risks.
  advanced: {
    // Better Auth reads/writes its own tables through the Kysely adapter
    // (database: pool above), not through the Drizzle instance that owns the
    // booking/media schema. The PostgreSQL Kysely dialect supports native
    // joins, so `get-session` and similar endpoints can fetch the user (and,
    // where relevant, account) rows in one round trip instead of one query
    // per relation.
    // No Drizzle relations are needed here; they only apply if this ever
    // switches to @better-auth/drizzle-adapter. See
    // docs/auth/performance-and-upgrades.md.
    database: {
      joins: true,
    },
    ipAddress: {
      ipAddressHeaders,
      ...(trustedProxies.length > 0 ? { trustedProxies } : {}),
    },
  },
  // Never send users to Better Auth's development-only HTML error page. The
  // SPA has a styled /auth/error route, and this URL is absolute so it also
  // works when the API and frontend are hosted on different origins.
  onAPIError: {
    errorURL,
  },
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
      // Philippines-only location. Barangay + city/municipality + province is
      // as specific as the profile goes — no street address is stored.
      // Optional so existing accounts and Google sign-ups stay valid; the
      // location editor only saves when all three are chosen.
      province: {
        type: 'string',
        required: false,
      },
      city_municipality: {
        type: 'string',
        required: false,
      },
      barangay: {
        type: 'string',
        required: false,
      },
      // Authorization flag. `input: false` + `defaultValue` is the whole
      // security story here: Better Auth overwrites any role a client sends
      // during sign-up with the default, and rejects the field outright on
      // update — so no request can promote its own account. Promotion happens
      // only through scripts/promote-admin.ts, straight to the database.
      // Admin API routes check this field via `requireAdmin`
      // (src/session-middleware.ts); see src/schema.ts for the column.
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
    },
  },
  trustedOrigins: [
    frontendOrigin,
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
