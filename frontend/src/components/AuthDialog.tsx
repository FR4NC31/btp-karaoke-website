import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import SignInForm from '../pages/auth/SignInForm'
import SignUpForm from '../pages/auth/SignUpForm'
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

  useEffect(() => {
    if (open && !isPending && session) {
      onClose()
      navigate(landingPathFor(session.user.role, searchParams.get('next')))
    }
  }, [open, isPending, session, onClose, navigate, searchParams])

  return (
    <Dialog
      open={open && !isPending}
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
          <SignUpForm email={email} onEmailChange={setEmail} onSwitch={onSwitch} onSuccess={onClose} />
        ) : mode === 'signin' ? (
          <SignInForm email={email} onEmailChange={setEmail} onSwitch={onSwitch} onSuccess={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
