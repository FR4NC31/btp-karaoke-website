import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import { isSessionExitInProgress, markSessionExit } from '../lib/session-exit'
import { SessionChecking, SessionUnavailable } from './SessionStates'

export default function RequireAdmin() {
  const { data, error, isPending, refetch } = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
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
    navigate(
      exitInProgress ? '/' : `/signin?next=${encodeURIComponent(pathname)}`,
      { replace: true },
    )
  }, [willBounce, navigate, pathname])

  const isAdmin = data?.user.role === 'admin'
  const notAdmin = !isPending && data && !isAdmin
  useEffect(() => {
    if (notAdmin) navigate('/studio', { replace: true })
  }, [notAdmin, navigate])

  if (isPending) return <SessionChecking />
  if (data) return isAdmin ? <Outlet /> : null
  if (error) return <SessionUnavailable />
  if (!checked) return <SessionChecking />
  return null
}
