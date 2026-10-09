import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { GoogleIcon } from '@hugeicons/core-free-icons'
import TextInput from '../../components/TextInput'
import PasswordField from '../../components/PasswordField'
import { signIn } from '../../lib/auth-client'
import { readableError, unexpectedError } from '../../lib/auth-errors'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

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

      navigate('/studio')
    } catch (err) {
      setError(unexpectedError('sign-in', err))
    } finally {
      // Runs on every path, including an unexpected rejection — otherwise the
      // button stays stuck on "Signing in…" with no way to retry.
      setSubmitting(false)
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
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 font-medium text-text-muted opacity-70 transition"
        >
          <HugeiconsIcon icon={GoogleIcon} size={18} />
          Continue with Google
          <span className="ml-1 rounded border border-border px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-text-muted uppercase">
            Soon
          </span>
        </button>
        <p className="mt-2 text-center text-[11px] text-text-muted">
          Google sign-in is not available yet — this is a prototype.
        </p>

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
