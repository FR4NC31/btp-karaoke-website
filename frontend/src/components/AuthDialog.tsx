import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import SignInForm from '../pages/auth/SignInForm'
import SignUpForm from '../pages/auth/SignUpForm'
import OtpVerificationModal from './OtpVerificationModal'
import { useSession } from '../lib/auth-client'
import { landingPathFor } from '../lib/redirects'
import type { AuthMode } from '../lib/auth-dialog'

type Props = {
  mode: AuthMode | null
  onClose: () => void
  onSwitch: (mode: AuthMode) => void
}

export default function AuthDialog({ mode, onClose, onSwitch }: Props) {
  const open = mode !== null
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState('')
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)

  // Hydrate pending verification from storage so a remount keeps the OTP flow.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('btp.pendingVerificationEmail')
      if (stored && !pendingVerificationEmail) {
        setPendingVerificationEmail(stored)
      }
    } catch {
      // ignore
    }
  }, [pendingVerificationEmail])

  useEffect(() => {
    const pending = (() => {
      try {
        return sessionStorage.getItem('btp.pendingVerificationEmail')
      } catch {
        return null
      }
    })()
    const hasPending = Boolean(pending && (!session?.user.email || pending === session.user.email))
    if (open && !isPending && session && !pendingVerificationEmail && !hasPending) {
      onClose()
      navigate(landingPathFor(session.user.role, searchParams.get('next')))
    }
  }, [open, isPending, session, pendingVerificationEmail, onClose, navigate, searchParams])

  function handleSignUpSuccess(registeredEmail: string) {
    setPendingVerificationEmail(registeredEmail)
  }

  async function handleVerifyOtp(code: string) {
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
      sessionStorage.removeItem('btp.pendingVerificationEmail')
    } catch {
      // ignore
    }
    setPendingVerificationEmail(null)
    onClose()
    navigate(landingPathFor('user', searchParams.get('next')))
  }

  async function handleResendOtp() {
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
    <>
      <Dialog
        open={open && !isPending && !pendingVerificationEmail}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
      >
        <DialogContent className="border border-border bg-surface p-6 text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-text-primary">
              {mode === 'signup' ? 'Create account' : 'Welcome back'}
            </DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              {mode === 'signup'
                ? 'Join BTP Karaoke to start singing'
                : 'Sign in to continue to BTP Karaoke'}
            </DialogDescription>
          </DialogHeader>

          {mode === 'signup' ? (
            <SignUpForm email={email} onEmailChange={setEmail} onSwitch={onSwitch} onSuccess={handleSignUpSuccess} onPendingStart={setPendingVerificationEmail} />
          ) : mode === 'signin' ? (
            <SignInForm email={email} onEmailChange={setEmail} onSwitch={onSwitch} onSuccess={onClose} />
          ) : null}
        </DialogContent>
      </Dialog>

      <OtpVerificationModal
        open={pendingVerificationEmail !== null}
        onOpenChange={() => {
          // Keep the pending verification state until verification succeeds.
        }}
        email={pendingVerificationEmail ?? ''}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </>
  )
}
