import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import TextInput from '../../components/TextInput'
import PasswordField from '../../components/PasswordField'
import googleIcon from '../../assets/icons/googleIcon.svg'
import { authClient, signIn } from '../../lib/auth-client'
import { landingPathFor } from '../../lib/redirects'
import { oauthError, readableError, unexpectedError } from '../../lib/auth-errors'
import type { AuthMode } from '../../lib/auth-dialog'

type Props = {
  /** Modal context: swap modes in place instead of routing. */
  onSwitch?: (mode: AuthMode) => void
  /** Called right before the post-auth redirect (lets a modal close first). */
  onSuccess?: () => void
  /** Modal context: email lifted to AuthDialog so it survives mode switches. */
  email?: string
  onEmailChange?: (email: string) => void
}

/**
 * Sign-in form logic shared by the /signin page and the auth modal.
 * Headings live in the wrappers, not here.
 */
export default function SignInForm({ onSwitch, onSuccess, email: emailProp, onEmailChange }: Props) {
  const [internalEmail, setInternalEmail] = useState('')
  const email = emailProp ?? internalEmail
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  function handleEmailChange(value: string) {
    if (emailProp === undefined) setInternalEmail(value)
    onEmailChange?.(value)
  }

  // A failed Google flow never rejects a request — Better Auth redirects back
  // to `errorCallbackURL` with a machine code in the query string, so if we
  // ignore it the user lands on a silently blank form.
  //
  // Read once in the state initializer instead of an effect: this arrives via
  // a full-page redirect, so there is no later change to subscribe to, and an
  // effect calling setError would trip react-hooks/set-state-in-effect.
  const [error, setError] = useState(() => {
    const code = searchParams.get('error')
    return code ? oauthError(code, searchParams.get('error_description')) : ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { error: signInError } = await signIn.email({ email, password })

      if (signInError) {
        setError(readableError(signInError))
        return
      }

      // Route by role: admins to the console, everyone else to the studio —
      // unless one of the guards parked a `?next=` target here, which wins
      // (validated in landingPathFor; it rides in a URL). The fresh session
      // read is what carries `role`; a failed read degrades to /studio,
      // which is always a safe landing.
      //
      // Nothing to settle first: RequireAuth revalidates before it will
      // redirect, so it can never act on the pre-login session value the
      // atom still holds here.
      let role: string | undefined
      try {
        const { data: freshSession } = await authClient.getSession()
        role = freshSession?.user.role ?? undefined
      } catch {
        // Fall through with no role — land in the studio.
      }
      onSuccess?.()
      navigate(landingPathFor(role, searchParams.get('next')))
    } catch (err) {
      setError(unexpectedError('sign-in', err))
    } finally {
      // Runs on every path, including an unexpected rejection — otherwise the
      // button stays stuck on "Signing in…" with no way to retry.
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setGoogleSubmitting(true)
    setError('')

    try {
      // Both targets must be absolute. Google hands the browser back to the
      // backend (`BETTER_AUTH_URL`/api/auth/callback/google), and Better Auth
      // then 302s to `callbackURL` verbatim — a relative "/studio" would
      // resolve against localhost:3000 and hit the API, not the SPA.
      //
      // Success lands on /signin, not /studio: RequireGuest owns the
      // guest-only route and bounces the finished session to its landing
      // page by role (admins → /admin, everyone else → /studio). Jumping
      // straight to /studio dropped admin sign-ins into the customer view.
      const origin = window.location.origin
      // Carry any parked `?next=` through the OAuth round trip. Without it an
      // admin bounced from a deep /admin page lands on the console overview
      // instead of the page they asked for. landingPathFor validates the value
      // again on arrival, so nothing new is trusted here.
      const next = searchParams.get('next')
      const callback = next
        ? `${origin}/signin?next=${encodeURIComponent(next)}`
        : `${origin}/signin`
      const { error: socialError } = await signIn.social({
        provider: 'google',
        callbackURL: callback,
        errorCallbackURL: callback,
      })

      // On success Better Auth returns a `url` and its client-side redirect
      // plugin navigates straight to Google, so reaching this line means the
      // flow never started. Report it instead of leaving a dead button.
      if (socialError) {
        setError(readableError(socialError))
        setGoogleSubmitting(false)
      }
      // On success the browser is leaving for Google — keep the flag set so
      // the "Redirecting to Google…" state holds and the button can't be
      // re-clicked mid-redirect. Only failure paths re-enable it.
    } catch (err) {
      setError(unexpectedError('Google sign-in', err))
      setGoogleSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <TextInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          autoComplete="email"
          required
        />
        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase text-text-muted">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleSubmitting}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 font-medium text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img src={googleIcon} alt="" width={18} height={18} />
        {googleSubmitting ? 'Redirecting to Google…' : 'Continue with Google'}
      </button>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        {onSwitch ? (
          <button
            type="button"
            onClick={() => onSwitch('signup')}
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign up
          </button>
        ) : (
          <Link to="/signup" className="font-medium text-primary hover:text-primary-hover">
            Sign up
          </Link>
        )}
      </p>
    </>
  )
}
