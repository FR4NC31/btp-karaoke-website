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
 * `{ error }` object. Codes come from Better Auth's `OAUTH_CALLBACK_ERROR_CODES`
 * (snake_case) plus whatever the provider itself sent (`access_denied` when
 * the user cancels the consent screen).
 *
 * Falls back to the server's `error_description` when we don't recognise the
 * code, so a new code degrades to something specific rather than vanishing.
 */
const OAUTH_MESSAGES: Record<string, string> = {
  access_denied: 'Google sign-in was cancelled.',
  state_not_found: 'Your sign-in session expired. Please try again.',
  state_security_mismatch: 'Google sign-in could not be verified. Please try again.',
  internal_server_error: 'Something went wrong on the server. Please try again.',
  no_code: 'Google did not send a sign-in response. Please try again.',
  invalid_code: 'Google did not accept the sign-in. Please try again.',
  oauth_provider_not_found: 'Google sign-in is not configured on the server.',
  unable_to_get_user_info: 'Google did not return your account details.',
  unable_to_create_user: 'Your account could not be created. Please try again.',
  unable_to_link_account: 'Google could not be linked to your account.',
  email_not_found: 'That Google account has no email address.',
  email_not_verified: 'That Google account is not verified.',
  no_callback_url: 'Google sign-in failed to return to the app.',
}

export function oauthError(code: string, description?: string | null): string {
  if (OAUTH_MESSAGES[code]) return OAUTH_MESSAGES[code]!
  return description || 'Google sign-in failed. Please try again.'
}
