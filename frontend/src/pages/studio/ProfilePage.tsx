import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  PencilIcon,
  Settings01Icon,
  UserIcon,
  Mail01Icon,
  PhoneIcon,
  MapPinIcon,
  CheckmarkCircle01Icon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import UserAvatar from '../../components/UserAvatar'
import { useSession } from '../../lib/auth-client'

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
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || 'Your Name'
  const email = user?.email ?? ''
  const phone = user?.contact_num || 'Not set'
  const handle = email ? `@${email.split('@')[0]}` : '@your_handle'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Tabs + member id */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setTab('account')}
            aria-current={tab === 'account' ? 'page' : undefined}
            className={`border-b-2 pb-3 font-heading text-sm font-bold tracking-widest uppercase transition ${
              tab === 'account' ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            My Account
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            aria-current={tab === 'profile' ? 'page' : undefined}
            className={`border-b-2 pb-3 font-heading text-sm font-bold tracking-widest uppercase transition ${
              tab === 'profile' ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            User Profile
          </button>
        </div>
        <div className="flex items-center gap-3 pb-3 text-xs font-semibold tracking-widest uppercase">
          <span className="text-text-secondary">Active Member</span>
          <span className="text-text-muted">
            ID: <span className="text-text-primary">#84920</span>
          </span>
        </div>
      </div>

      {tab === 'account' ? (
        <>
          {/* Profile card */}
          <section className="flex flex-wrap items-start gap-5 rounded-xl border border-border bg-surface p-6">
            <div className="relative shrink-0">
              <UserAvatar
                image={user?.image}
                icon={UserIcon}
                iconSize={36}
                className="size-24 rounded-xl"
              />
              <span className="absolute -right-1 -bottom-1 size-4 rounded-full border-2 border-surface bg-success" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl font-bold tracking-wide uppercase">{fullName}</h1>
                <span className="rounded border border-border px-2 py-0.5 text-[10px] font-bold tracking-widest text-text-secondary uppercase">
                  Standard Member
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {handle}
                {memberSince && <> · Member since {memberSince}</>}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
                Karaoke lover and acoustic enthusiast. Singing along to classic OPM and pop hits!
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-primary-hover"
              >
                <HugeiconsIcon icon={PencilIcon} size={15} />
                Edit Profile
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
              >
                <HugeiconsIcon icon={Settings01Icon} size={15} />
                Settings
              </button>
            </div>
          </section>

          {/* Personal details */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={UserIcon} size={18} className="text-primary" />
                <h2 className="font-heading text-lg font-bold tracking-widest uppercase">Personal Details</h2>
              </div>
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover">
                <HugeiconsIcon icon={PencilIcon} size={13} />
                Update
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailField
                icon={UserIcon}
                label="Full Name"
                value={fullName}
                hint="Display name across singing sessions"
              />
              <DetailField
                icon={Mail01Icon}
                label="Email Address"
                value={email}
                hint="Primary Email"
                verified
              />
              <DetailField
                icon={PhoneIcon}
                label="Phone Number"
                value={phone}
                hint="Used for room reservation/reminders"
              />
              <DetailField
                icon={MapPinIcon}
                label="Location / City"
                value="Quezon City, Metro Manila"
                hint="Philippines"
              />
            </div>
          </section>

          {/* Singing & audio preferences */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={MusicNote01Icon} size={18} className="text-primary" />
                <h2 className="font-heading text-lg font-bold tracking-widest uppercase">Singing &amp; Audio Preferences</h2>
              </div>
              <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-success uppercase">
                Saved
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailField label="Preferred Vocal Range" value="Midrange (B3 – D5)" hint="Used to suggest song keys" />
              <DetailField label="Default Monitor Mix" value="Vocals +3 dB" hint="In-ear balance for rehearsals" />
              <DetailField label="Reverb Preset" value="Hall Warm" hint="Applied on studio playback" />
              <DetailField label="Lyrics Display" value="Large text · Tagalog transliteration" hint="Rehearsal screen overlay" />
            </div>
          </section>
        </>
      ) : (
        /* User Profile tab — public-facing view (prototype placeholder) */
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserIcon} size={18} className="text-primary" />
            <h2 className="font-heading text-lg font-bold tracking-widest uppercase">Public Profile</h2>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Your public card shows your display name, avatar and most-sung genres to other singers in the
            Listening Room. Profile editing lands here in a later pass.
          </p>
        </section>
      )}
    </div>
  )
}

interface DetailFieldProps {
  icon?: IconSvgElement
  label: string
  value: string
  hint: string
  verified?: boolean
}

function DetailField({ icon, label, value, hint, verified }: DetailFieldProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
        {icon && <HugeiconsIcon icon={icon} size={12} />}
        {label}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold break-words text-text-primary">
        {value}
        {verified && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="shrink-0 text-success" />}
      </p>
      <p className={`mt-0.5 text-[11px] ${verified ? 'text-success' : 'text-text-muted'}`}>{hint}</p>
    </div>
  )
}
