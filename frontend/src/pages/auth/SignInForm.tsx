import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import TextInput from '../../components/TextInput'
import PasswordField from '../../components/PasswordField'
import googleIcon from '../../assets/icons/googleIcon.svg'
import spotifyIcon from '../../assets/icons/spotifyIcon.svg'
import { authClient, signIn } from '../../lib/auth-client'
import { landingPathFor } from '../../lib/redirects'
import { oauthError, readableError, unexpectedError } from '../../lib/auth-errors'
import type { AuthMode } from '../../lib/auth-dialog'

type Props = {
  onSwitch?: (mode: AuthMode) => void
  onSuccess?: () => void
  email?: string
  onEmailChange?: (email: string) => void
}

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

  const [error, setError] = useState(() => {
    const code = searchParams.get('error')
    return code
      ? oauthError(code, searchParams.get('error_description'), searchParams.get('provider'))
      : ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [spotifySubmitting, setSpotifySubmitting] = useState(false)

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

      let role: string | undefined
      try {
        const { data: freshSession } = await authClient.getSession()
        role = freshSession?.user.role ?? undefined
      } catch {
        role = undefined
      }
      onSuccess?.()
      navigate(landingPathFor(role, searchParams.get('next')))
    } catch (err) {
      setError(unexpectedError('sign-in', err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setGoogleSubmitting(true)
    setError('')

    try {
      const origin = window.location.origin
      const next = searchParams.get('next')
      const callback = next
        ? `${origin}/signin?next=${encodeURIComponent(next)}`
        : `${origin}/signin`
      const { error: socialError } = await signIn.social({
        provider: 'google',
        callbackURL: callback,
        errorCallbackURL: callback,
      })

      if (socialError) {
        setError(readableError(socialError))
        setGoogleSubmitting(false)
      }
    } catch (err) {
      setError(unexpectedError('Google sign-in', err))
      setGoogleSubmitting(false)
    }
  }

  async function handleSpotify() {
    setSpotifySubmitting(true)
    setError('')

    try {
      const origin = window.location.origin
      const next = searchParams.get('next')
      const callback = next
        ? `${origin}/signin?next=${encodeURIComponent(next)}`
        : `${origin}/signin`
      // provider=spotify rides only on the error return so a failed flow
      // renders "Spotify …" wording; Better Auth appends ?error= with
      // appendQueryParams, which keeps the tag intact (lib/auth-errors.ts).
      const { error: socialError } = await signIn.social({
        provider: 'spotify',
        callbackURL: callback,
        errorCallbackURL: `${callback}${next ? '&' : '?'}provider=spotify`,
      })

      if (socialError) {
        setError(readableError(socialError))
        setSpotifySubmitting(false)
      }
    } catch (err) {
      setError(unexpectedError('Spotify sign-in', err))
      setSpotifySubmitting(false)
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

      {/*
        Both social buttons sit in equal columns; the label is 11px so
        "Continue with Google" / "Continue with Spotify" fit half a card.
        Spotify mirrors handleGoogle: the backend registers the spotify
        provider, and its error return is tagged provider=spotify so a
        failure reads "Spotify …" instead of the Google default
        (oauthError in lib/auth-errors.ts).
      */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleSubmitting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2 py-2.5 text-[11px] font-medium text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={googleIcon} alt="" width={16} height={16} className="shrink-0" />
          <span className="text-center leading-tight">
            {googleSubmitting ? 'Redirecting to Google…' : 'Continue with Google'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSpotify}
          disabled={spotifySubmitting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2 py-2.5 text-[11px] font-medium text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={spotifyIcon} alt="" width={16} height={16} className="shrink-0" />
          <span className="text-center leading-tight">
            {spotifySubmitting ? 'Redirecting to Spotify…' : 'Continue with Spotify'}
          </span>
        </button>
      </div>

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
