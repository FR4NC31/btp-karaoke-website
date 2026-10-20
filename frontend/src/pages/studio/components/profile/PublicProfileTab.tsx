import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon } from '@hugeicons/core-free-icons'

/** User Profile tab — public-facing view (prototype placeholder). */
export default function PublicProfileTab() {
  return (
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
  )
}
