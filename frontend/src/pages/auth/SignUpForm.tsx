import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import TextInput from '../../components/TextInput'
import PasswordField from '../../components/PasswordField'
import { signUp } from '../../lib/auth-client'
import { readableError, unexpectedError } from '../../lib/auth-errors'
import type { AuthMode } from '../../lib/auth-dialog'

type Props = {
  onSwitch?: (mode: AuthMode) => void
  onSuccess?: () => void
  email?: string
  onEmailChange?: (email: string) => void
}

export default function SignUpForm({ onSwitch, onSuccess, email: emailProp, onEmailChange }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [internalEmail, setInternalEmail] = useState('')
  const email = emailProp ?? internalEmail
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleEmailChange(value: string) {
    if (emailProp === undefined) setInternalEmail(value)
    onEmailChange?.(value)
  }

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

      onSuccess?.()
      navigate('/studio')
    } catch (err) {
      setError(unexpectedError('sign-up', err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
          onChange={(e) => handleEmailChange(e.target.value)}
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
        {onSwitch ? (
          <button
            type="button"
            onClick={() => onSwitch('signin')}
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign in
          </button>
        ) : (
          <Link to="/signin" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        )}
      </p>
    </>
  )
}
