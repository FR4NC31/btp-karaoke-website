/**
 * Better Auth returns machine codes like `USER_ALREADY_EXISTS` or
 * `INVALID_EMAIL_OR_PASSWORD`. Turn them into something a person can act on,
 * and fall back to the raw message for codes we haven't mapped yet.
 */
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

/**
 * Better Auth reports *expected* failures (wrong password, duplicate email)
 * as `{ error }`, handled by `readableError` above.
 *
 * It can also **reject** — when the request itself fails: backend down, dev
 * proxy error, timeout, malformed response. Awaiting it outside a try/catch
 * lets that rejection escape the async handler, so `setSubmitting(false)`
 * never runs, no message is set, and the form just sits on the page with the
 * button spinning. That is a silent failure.
 *
 * Call this from the `catch` block: it logs the raw cause so the failure is
 * never invisible, and returns text that is safe to show a user.
 */
export function unexpectedError(scope: string, err: unknown): string {
  console.error(`[auth] ${scope} failed:`, err)
  return 'Could not reach the server. Please check your connection and try again.'
}

/**
 * Social sign-in never *rejects* — it ends in a browser redirect, so Better
 * Auth appends a machine code to `errorCallbackURL` instead of returning an
 * `{ error }` object.
 *
 * Three families of code can land here, all snake_case:
 *
 *   1. `OAUTH_CALLBACK_ERROR_CODES` (better-auth/oauth2/errors) — the codes
 *      our own callback emits;
 *   2. `handleOAuthUserInfo` results, space-joined then underscored by the
 *      callback (`"account not linked"` -> `account_not_linked`);
 *   3. whatever Google itself sent, forwarded verbatim by the callback
 *      (`access_denied` when the user cancels the consent screen).
 *
 * `account_not_linked` is the one worth reading: it means Better Auth found a
 * local user with that email and refused to merge the Google identity into it
 * (see the `account.accountLinking` options in backend/src/auth.ts). Without a
 * message here it degrades to the generic line below, which tells the user
 * nothing about the password account they already have.
 *
 * Falls back to the server's `error_description` when we don't recognise the
 * code, so a new code degrades to something specific rather than vanishing.
 */
const OAUTH_MESSAGES: Record<string, string> = {
  // The user backed out of the Google consent screen.
  access_denied: 'Google sign-in was cancelled.',

  // The email Google returned does not match what we expected.
  email_does_not_match: 'That Google account uses a different email address.',
  email_not_found: 'That Google account has no email address.',
  email_not_verified: 'That Google account is not verified.',

  // An account already exists for this email — the link was refused.
  account_not_linked:
    'That email already has an account with us. Sign in with your email and password instead, or use a different Google account.',
  account_already_linked_to_different_user:
    'That Google account is already linked to a different account.',
  unable_to_link_account: 'Google could not be linked to your account.',

  // Google answered, but not with something we could use.
  no_code: 'Google did not send a sign-in response. Please try again.',
  invalid_code: 'Google did not accept the sign-in. Please try again.',
  unable_to_get_user_info: 'Google did not return your account details.',
  user_not_found: 'No account matches that Google sign-in.',
  no_callback_url: 'Google sign-in failed to return to the app.',

  // Our server rejected the callback.
  oauth_provider_not_found: 'Google sign-in is not configured on the server.',
  state_not_found: 'Your sign-in session expired. Please try again.',
  state_security_mismatch: 'Google sign-in could not be verified. Please try again.',
  nonce_binding_missing: 'Google sign-in could not be verified. Please try again.',
  issuer_missing: 'Google sign-in is misconfigured on the server.',
  issuer_mismatch: 'Google sign-in is misconfigured on the server.',
  internal_server_error: 'Something went wrong on the server. Please try again.',
  signup_disabled: 'Creating new accounts is currently disabled.',
  unable_to_create_user: 'Your account could not be created. Please try again.',
  unable_to_update_account: 'Your account could not be updated. Please try again.',
  unable_to_create_session: 'Your session could not be started. Please try again.',

  // Google's own OAuth errors, forwarded untouched by the callback.
  invalid_request: 'Google did not understand the sign-in request. Please try again.',
  invalid_client: 'Google did not recognise this application.',
  invalid_grant: 'Google rejected the sign-in response. Please try again.',
  unauthorized_client: 'This application is not allowed to sign in with Google.',
  unsupported_response_type: 'Google sign-in is misconfigured on the server.',
  invalid_scope: 'Google sign-in is misconfigured on the server.',
  server_error: 'Google had a problem completing sign-in. Please try again.',
  temporarily_unavailable: 'Google sign-in is temporarily unavailable. Please try again.',
}

export function oauthError(code: string, description?: string | null): string {
  if (OAUTH_MESSAGES[code]) return OAUTH_MESSAGES[code]!
  return description || 'Google sign-in failed. Please try again.'
}
