const MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: 'An account with that email already exists.',
  INVALID_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
  PASSWORD_TOO_SHORT: 'Password is too short.',
  PASSWORD_TOO_LONG: 'Password is too long.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait and try again.',
}

export function readableError(error: { code?: string; message?: string }): string {
  if (error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code]!
  }
  return error.message ?? 'Something went wrong. Please try again.'
}

export function unexpectedError(scope: string, err: unknown): string {
  console.error(`[auth] ${scope} failed:`, err)
  return 'Could not reach the server. Please check your connection and try again.'
}

// `{P}` is replaced with the provider's display name at render time so one
// map serves both flows: Google wording before, "Spotify …" after, without a
// second copy of every string to keep in sync.
const OAUTH_MESSAGES: Record<string, string> = {
  access_denied: '{P} sign-in was cancelled.',

  email_does_not_match: 'That {P} account uses a different email address.',
  email_not_found: 'That {P} account has no email address.',
  email_not_verified: 'That {P} account is not verified.',

  account_not_linked:
    'That email already has an account with us. Sign in with your email and password instead, or use a different {P} account.',
  account_already_linked_to_different_user:
    'That {P} account is already linked to a different account.',
  unable_to_link_account: '{P} could not be linked to your account.',

  no_code: '{P} did not send a sign-in response. Please try again.',
  invalid_code: '{P} did not accept the sign-in. Please try again.',
  unable_to_get_user_info: '{P} did not return your account details.',
  user_not_found: 'No account matches that {P} sign-in.',
  no_callback_url: '{P} sign-in failed to return to the app.',

  oauth_provider_not_found: '{P} sign-in is not configured on the server.',
  state_not_found: 'Your sign-in session expired. Please try again.',
  state_security_mismatch: '{P} sign-in could not be verified. Please try again.',
  nonce_binding_missing: '{P} sign-in could not be verified. Please try again.',
  issuer_missing: '{P} sign-in is misconfigured on the server.',
  issuer_mismatch: '{P} sign-in is misconfigured on the server.',
  internal_server_error: 'Something went wrong on the server. Please try again.',
  signup_disabled: 'Creating new accounts is currently disabled.',
  unable_to_create_user: 'Your account could not be created. Please try again.',
  unable_to_update_account: 'Your account could not be updated. Please try again.',
  unable_to_create_session: 'Your session could not be started. Please try again.',

  invalid_request: '{P} did not understand the sign-in request. Please try again.',
  invalid_client: '{P} did not recognise this application.',
  invalid_grant: '{P} rejected the sign-in response. Please try again.',
  unauthorized_client: 'This application is not allowed to sign in with {P}.',
  unsupported_response_type: '{P} sign-in is misconfigured on the server.',
  invalid_scope: '{P} sign-in is misconfigured on the server.',
  server_error: '{P} had a problem completing sign-in. Please try again.',
  temporarily_unavailable: '{P} sign-in is temporarily unavailable. Please try again.',
}

// Unknown or absent providers read as Google, which keeps every flow that
// does not tag `provider` (the global /auth/error fallback, older links)
// worded exactly as before.
const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  spotify: 'Spotify',
}

/**
 * Maps a Better Auth OAuth error code to user-facing text.
 *
 * `provider` is the `provider` query parameter that `signIn.social`'s
 * `errorCallbackURL` tags onto the error return (see `handleSpotify` in
 * SignInForm) — Better Auth appends `?error=` with `appendQueryParams`, which
 * preserves it. Untagged flows default to Google.
 */
export function oauthError(
  code: string,
  description?: string | null,
  provider?: string | null,
): string {
  const label = PROVIDER_LABELS[provider ?? 'google'] ?? 'Google'
  const template = OAUTH_MESSAGES[code]
  if (template) return template.replaceAll('{P}', label)
  return description || `${label} sign-in failed. Please try again.`
}
