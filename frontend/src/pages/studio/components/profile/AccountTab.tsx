import { HugeiconsIcon } from '@hugeicons/react'
import {
  PencilIcon,
  Settings01Icon,
  UserIcon,
  Mail01Icon,
  PhoneIcon,
  MapPinIcon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import UserAvatar from '../../../../components/UserAvatar'
import DetailField from './DetailField'
import type { ProfileIdentity } from './types'

/** My Account tab: identity card, personal details, singing preferences. */
export default function AccountTab({ identity }: { identity: ProfileIdentity }) {
  const { image, fullName, email, emailVerified, phone, handle, memberSince } = identity

  return (
    <>
      {/* Profile card */}
      <section className="flex flex-wrap items-start gap-5 rounded-xl border border-border bg-surface p-6">
        <div className="relative shrink-0">
          <UserAvatar
            image={image}
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
            verified={emailVerified}
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
  )
}
