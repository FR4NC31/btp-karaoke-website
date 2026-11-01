import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useSession } from '../lib/auth-client'
import { landingPathFor } from '../lib/redirects'
import { SessionChecking } from './SessionStates'

const PENDING_KEY = 'btp.pendingVerificationEmail'

function hasPendingVerification() {
  try {
    return Boolean(sessionStorage.getItem(PENDING_KEY))
  } catch {
    return false
  }
}

export default function RequireGuest() {
  const { data, isPending } = useSession()
  const [searchParams] = useSearchParams()

  if (isPending) return <SessionChecking />
  if (data && !hasPendingVerification()) {
    return <Navigate to={landingPathFor(data.user.role, searchParams.get('next'))} replace />
  }

  return <Outlet />
}
