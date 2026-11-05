import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useSession } from '../lib/auth-client'
import { landingPathFor } from '../lib/redirects'
import { SessionCheckingGuest } from './SessionStates'

const PENDING_KEY = 'btp.pendingVerificationEmail'

function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

function hasPendingVerification(sessionEmail?: string | null): boolean {
  const pending = readPendingEmail()
  if (!pending) return false
  if (sessionEmail && pending !== sessionEmail) {
    try {
      sessionStorage.removeItem(PENDING_KEY)
    } catch {
      // ignore
    }
    return false
  }
  return true
}

export default function RequireGuest() {
  const { data, isPending } = useSession()
  const [searchParams] = useSearchParams()

  if (isPending) return <SessionCheckingGuest />
  if (data && !hasPendingVerification(data.user.email)) {
    return <Navigate to={landingPathFor(data.user.role, searchParams.get('next'))} replace />
  }

  return <Outlet />
}
