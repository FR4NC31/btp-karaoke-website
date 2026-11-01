import { useState } from 'react'
import { useNavigate } from 'react-router'
import SignUpForm from './SignUpForm'
import OtpVerificationModal from '../../components/OtpVerificationModal'

const PENDING_KEY = 'btp.pendingVerificationEmail'

export default function SignUp() {
  const navigate = useNavigate()
  const [pendingEmail, setPendingEmail] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PENDING_KEY)
    } catch {
      return null
    }
  })

  function handleSignUpSuccess(email: string) {
    try {
      sessionStorage.setItem(PENDING_KEY, email)
    } catch {
      // ignore storage failures
    }
    setPendingEmail(email)
  }

  async function handleVerify(code: string) {
    const res = await fetch('/api/me/email/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: code }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Invalid verification code')
    }
    try {
      sessionStorage.removeItem(PENDING_KEY)
    } catch {
      // ignore
    }
    setPendingEmail(null)
    navigate('/studio')
  }

  async function handleResend() {
    const res = await fetch('/api/me/email/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to resend verification code')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-4xl font-semibold text-text-primary">Create account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Join BTP Karaoke to start singing
        </p>

        <SignUpForm onSuccess={handleSignUpSuccess} />

        <OtpVerificationModal
          open={pendingEmail !== null}
          onOpenChange={() => {
            // Keep the pending verification state until verification succeeds.
          }}
          email={pendingEmail ?? ''}
          onVerify={handleVerify}
          onResend={handleResend}
        />
      </div>
    </div>
  )
}
