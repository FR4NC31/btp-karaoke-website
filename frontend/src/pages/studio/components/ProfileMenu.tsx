import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon, Settings01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import Placeholder from '../../../components/Placeholder'
import { signOut, useSession } from '../../../lib/auth-client'

/**
 * Avatar button + dropdown in the studio top bar. Owns its own open state,
 * the Escape-key listener and the sign-out flow — the top bar only has to
 * render <ProfileMenu />.
 *
 * Name and email come from the live Better Auth session, so the menu always
 * reflects the account that signed in (first/last name recorded at sign-up;
 * the single `name` column is the fallback). Profile picture is not wired
 * yet — the striped placeholder avatar stays until it is.
 */
export default function ProfileMenu() {
  const [profileOpen, setProfileOpen] = useState(false)
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
    setProfileOpen(false)
    try {
      // Clear the backend session before leaving; navigating
      // alone would leave the cookie valid.
      await signOut()
    } catch (err) {
      console.error('[auth] sign-out failed:', err)
    } finally {
      // Leave regardless. If the server is unreachable the
      // cookie cannot be cleared either way, and stranding
      // the user here would be worse than going to /signin.
      navigate('/signin')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setProfileOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={profileOpen}
        className={`block rounded-full transition ring-offset-2 ring-offset-surface focus:outline-none ${
          profileOpen ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-border'
        }`}
      >
        <Placeholder icon={UserIcon} iconSize={16} className="size-9 rounded-full" />
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
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-primary-soft hover:text-error"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
