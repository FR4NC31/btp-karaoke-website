type ProfileTabsProps = {
  tab: 'account' | 'profile'
  onTabChange: (tab: 'account' | 'profile') => void
}

/** Tab switcher + the mockup's static member ID. */
export default function ProfileTabs({ tab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
      <div className="flex gap-6">
        <button
          type="button"
          onClick={() => onTabChange('account')}
          aria-current={tab === 'account' ? 'page' : undefined}
          className={`border-b-2 pb-3 font-heading text-sm font-bold tracking-widest uppercase transition ${
            tab === 'account' ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          My Account
        </button>
        <button
          type="button"
          onClick={() => onTabChange('profile')}
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
  )
}
