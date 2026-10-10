import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { GoogleIcon } from '@hugeicons/core-free-icons'
import TextInput from '../../components/TextInput'
import PasswordField from '../../components/PasswordField'
import { signIn } from '../../lib/auth-client'
import { oauthError, readableError, unexpectedError } from '../../lib/auth-errors'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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

      // Nothing to settle first: RequireAuth revalidates before it will
      // redirect, so it can never act on the pre-login session value the
      // atom still holds here.
      navigate('/studio')
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
      const origin = window.location.origin
      const { error: socialError } = await signIn.social({
        provider: 'google',
        callbackURL: `${origin}/studio`,
        errorCallbackURL: `${origin}/signin`,
      })

      // On success Better Auth returns a `url` and its client-side redirect
      // plugin navigates straight to Google, so reaching this line means the
      // flow never started. Report it instead of leaving a dead button.
      if (socialError) setError(readableError(socialError))
    } catch (err) {
      setError(unexpectedError('Google sign-in', err))
    } finally {
      // Only meaningfully runs on failure — a successful flow navigates away.
      setGoogleSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-4xl font-semibold text-text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in to continue to BTP Karaoke
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <TextInput
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <HugeiconsIcon icon={GoogleIcon} size={18} />
          {googleSubmitting ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-primary-hover">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
