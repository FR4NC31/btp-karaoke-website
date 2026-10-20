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

const OAUTH_MESSAGES: Record<string, string> = {
  access_denied: 'Google sign-in was cancelled.',

  email_does_not_match: 'That Google account uses a different email address.',
  email_not_found: 'That Google account has no email address.',
  email_not_verified: 'That Google account is not verified.',

  account_not_linked:
    'That email already has an account with us. Sign in with your email and password instead, or use a different Google account.',
  account_already_linked_to_different_user:
    'That Google account is already linked to a different account.',
  unable_to_link_account: 'Google could not be linked to your account.',

  no_code: 'Google did not send a sign-in response. Please try again.',
  invalid_code: 'Google did not accept the sign-in. Please try again.',
  unable_to_get_user_info: 'Google did not return your account details.',
  user_not_found: 'No account matches that Google sign-in.',
  no_callback_url: 'Google sign-in failed to return to the app.',

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
