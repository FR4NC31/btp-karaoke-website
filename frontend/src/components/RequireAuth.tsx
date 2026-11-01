import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import { isSessionExitInProgress, markSessionExit } from '../lib/session-exit'
import { SessionChecking, SessionUnavailable } from './SessionStates'

const PENDING_KEY = 'btp.pendingVerificationEmail'

function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

export default function RequireAuth() {
  const { data, error, isPending, refetch } = useSession()
  const navigate = useNavigate()
  const asked = useRef(false)
  const sawSession = useRef(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (error) console.error('[auth] session check failed:', error)
  }, [error])

  useEffect(() => {
    if (data) {
      sawSession.current = true
      markSessionExit(false)
    }
  }, [data])

  useEffect(() => {
    if (data || isPending || asked.current) return
    asked.current = true
    void refetch().finally(() => setChecked(true))
  }, [data, isPending, refetch])

  const willBounce = !isPending && !data && !error && checked
  useEffect(() => {
    if (!willBounce) return
    const exitInProgress = sawSession.current && isSessionExitInProgress()
    navigate(exitInProgress ? '/' : '/signin', { replace: true })
  }, [willBounce, navigate])

  const pendingEmail = readPendingEmail()
  const needsVerification =
    Boolean(data?.user && !data.user.emailVerified && pendingEmail && pendingEmail === data.user.email)

  useEffect(() => {
    if (needsVerification) {
      navigate('/signup', { replace: true })
    }
  }, [needsVerification, navigate])

  if (isPending) return <SessionChecking />
  if (needsVerification) return <SessionChecking />
  if (data) return <Outlet />
  if (error) return <SessionUnavailable />
  if (!checked) return <SessionChecking />
  return null
}
