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
