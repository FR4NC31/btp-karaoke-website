import { useState } from 'react'
import { useSession } from '../../lib/auth-client'
import AccountTab from './components/profile/AccountTab'
import ProfileTabs from './components/profile/ProfileTabs'
import PublicProfileTab from './components/profile/PublicProfileTab'
import type { ProfileIdentity } from './components/profile/types'

/**
 * /studio/profile — MY ACCOUNT tab of the user profile mockup.
 *
 * Identity fields (name, email, phone, handle, member-since) come from the
 * live Better Auth session, same source as the ProfileMenu dropdown — never
 * stale hardcoded names. Location/city has no backend column yet, so it stays
 * the mockup's placeholder. Edit / Update actions are visual-only.
 */
export default function ProfilePage() {
  const [tab, setTab] = useState<'account' | 'profile'>('account')
  const { data } = useSession()

  const user = data?.user
  const identity: ProfileIdentity = {
    image: user?.image,
    fullName: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || 'Your Name',
    email: user?.email ?? '',
    phone: user?.contact_num || 'Not set',
    handle: user?.email ? `@${user.email.split('@')[0]}` : '@your_handle',
    memberSince: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '',
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ProfileTabs tab={tab} onTabChange={setTab} />
      {tab === 'account' ? <AccountTab identity={identity} /> : <PublicProfileTab />}
    </div>
  )
}
