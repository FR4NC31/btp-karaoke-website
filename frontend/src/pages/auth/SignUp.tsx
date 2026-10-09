import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import TextInput from '../../components/TextInput'
import PasswordField from '../../components/PasswordField'
import { signUp, useSession } from '../../lib/auth-client'
import { readableError, unexpectedError } from '../../lib/auth-errors'

export default function SignUp() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { refetch } = useSession()

  function handleContactChange(e: ChangeEvent<HTMLInputElement>) {
    setContact(e.target.value.replace(/\D/g, '').slice(0, 11))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (contact.length !== 11) {
      setError('Contact number must be exactly 11 digits')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { error: signUpError } = await signUp.email({
        // Better Auth stores a single `name`; we keep the split fields too.
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        contact_num: contact,
      })

      if (signUpError) {
        setError(readableError(signUpError))
        return
      }

      // Same settle step as the sign-in form: signUp.email() issues the
      // cookie but leaves the session atom holding whatever the last check
      // produced, and RequireAuth redirects on that value. Refreshing it
      // here means the guard evaluates the session we just created instead
      // of one stale by a few milliseconds.
      await refetch()

      navigate('/studio')
    } catch (err) {
      setError(unexpectedError('sign-up', err))
    } finally {
      // Runs on every path, including an unexpected rejection — otherwise the
      // button stays stuck on "Creating account…" with no way to retry.
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-4xl font-semibold text-text-primary">Create account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Join BTP Karaoke to start singing
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              id="firstName"
              label="First name"
              placeholder="Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
            <TextInput
              id="lastName"
              label="Last name"
              placeholder="Dela Cruz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>

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

          <TextInput
            id="contact"
            label="Contact number"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="09XXXXXXXXX"
            value={contact}
            onChange={handleContactChange}
            autoComplete="tel"
            required
          />

          <PasswordField
            id="password"
            label="Password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
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
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
