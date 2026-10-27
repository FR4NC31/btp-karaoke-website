import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon, Settings01Icon, Logout01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
import UserAvatar from '../../../components/UserAvatar'
import { signOut, useSession } from '../../../lib/auth-client'
import { readableError, unexpectedError } from '../../../lib/auth-errors'
import { markSessionExit } from '../../../lib/session-exit'

export default function ProfileMenu({ showIdentity = false }: { showIdentity?: boolean }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const navigate = useNavigate()
  const { data } = useSession()

  const user = data?.user
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || 'Guest'
  const email = user?.email ?? 'Not signed in'

  useEffect(() => {
    if (!profileOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [profileOpen])

  async function handleSignOut() {
    if (signingOut) return
    setSignOutError('')
    setSigningOut(true)
    markSessionExit(true)
    try {
      const { error } = await signOut()
      if (error) {
        markSessionExit(false)
        setSignOutError(readableError(error))
        return
      }
    } catch (err) {
      markSessionExit(false)
      setSignOutError(unexpectedError('sign-out', err))
      return
    } finally {
      setSigningOut(false)
    }
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setProfileOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={profileOpen}
        className={`transition ring-offset-2 ring-offset-surface focus:outline-none ${
          showIdentity
            ? 'flex items-center gap-2 rounded-lg px-1.5 py-1'
            : 'block rounded-full'
        } ${profileOpen ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-border'}`}
      >
        <UserAvatar
          image={user?.image}
          icon={UserIcon}
          iconSize={16}
          className="size-9 shrink-0 rounded-full"
        />
        {showIdentity && (
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-32 truncate text-xs font-semibold text-text-primary">
              {name}
            </span>
            <span className="block text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Admin
            </span>
          </span>
        )}
        {showIdentity && (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={12}
            className="hidden shrink-0 text-text-muted sm:block"
          />
        )}
      </button>

      {profileOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface-elevated py-1 shadow-xl shadow-black/40">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-[11px] text-text-muted">{email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false)
                navigate('/studio/profile')
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-surface hover:text-text-primary"
            >
              <HugeiconsIcon icon={UserIcon} size={16} />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-surface hover:text-text-primary"
            >
              <HugeiconsIcon icon={Settings01Icon} size={16} />
              Settings
            </button>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-primary-soft hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              {signingOut ? 'Signing out…' : 'Log out'}
            </button>
            {signOutError && (
              <p role="alert" className="px-4 pb-2 pt-1 text-xs text-error">
                {signOutError}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
