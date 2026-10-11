import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import SignInForm from '../pages/auth/SignInForm'
import SignUpForm from '../pages/auth/SignUpForm'
import { useSession } from '../lib/auth-client'
import type { AuthMode } from '../lib/auth-dialog'

type Props = {
  mode: AuthMode | null
  onClose: () => void
  onSwitch: (mode: AuthMode) => void
}

/**
 * Landing-page auth modal. Renders the same form components as the
 * /signin and /signup fallback pages, with the cross-links switching
 * modes in place instead of routing.
 */
export default function AuthDialog({ mode, onClose, onSwitch }: Props) {
  const open = mode !== null
  const navigate = useNavigate()
  const { data: session } = useSession()

  // Same contract as RequireGuest: a signed-in user gets bounced to /studio
  // instead of being offered a sign-in form they no longer need.
  useEffect(() => {
    if (open && session) {
      onClose()
      navigate('/studio')
    }
  }, [open, session, onClose, navigate])

  return (
    <Dialog
      open={open}
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
          <SignUpForm onSwitch={onSwitch} onSuccess={onClose} />
        ) : mode === 'signin' ? (
          <SignInForm onSwitch={onSwitch} onSuccess={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
