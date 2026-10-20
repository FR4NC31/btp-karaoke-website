import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Search01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import type { TagUser } from '../../../../lib/admin-api'
import type { CustomerMode } from './types'

type CustomerFieldsetProps = {
  mode: CustomerMode
  onModeChange: (mode: CustomerMode) => void
  selectedUser: TagUser | null
  onClearUser: () => void
  userQuery: string
  onUserQueryChange: (value: string) => void
  searchingUsers: boolean
  userSearchError: string
  userResults: TagUser[]
  onPickUser: (user: TagUser) => void
  guestName: string
  onGuestNameChange: (value: string) => void
}

export default function CustomerFieldset({
  mode,
  onModeChange,
  selectedUser,
  onClearUser,
  userQuery,
  onUserQueryChange,
  searchingUsers,
  userSearchError,
  userResults,
  onPickUser,
  guestName,
  onGuestNameChange,
}: CustomerFieldsetProps) {
  return (
    <fieldset className="rounded-xl border border-border bg-surface p-5">
      <legend className="px-1 text-[11px] font-bold tracking-widest text-text-secondary uppercase">
        Customer
      </legend>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={mode === 'user'}
          onClick={() => onModeChange('user')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold tracking-widest uppercase transition ${
            mode === 'user'
              ? 'bg-primary-soft text-primary'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <HugeiconsIcon icon={UserMultiple02Icon} size={14} />
          Registered customer
        </button>
        <button
          type="button"
          aria-pressed={mode === 'guest'}
          onClick={() => onModeChange('guest')}
          className={`rounded-lg px-4 py-2 text-xs font-bold tracking-widest uppercase transition ${
            mode === 'guest'
              ? 'bg-primary-soft text-primary'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          Guest name
        </button>
      </div>

      {mode === 'user' ? (
        <div className="mt-4">
          {selectedUser ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary-soft/30 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{selectedUser.name}</p>
                <p className="text-xs text-text-muted">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={onClearUser}
                aria-label="Clear selected customer"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface hover:text-text-primary"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>
          ) : (
            <>
              <label
                htmlFor="customer-search"
                className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
              >
                Find an account
              </label>
              <div className="relative mt-2">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={15}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="customer-search"
                  type="search"
                  placeholder="Name or email…"
                  value={userQuery}
                  onChange={(e) => onUserQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault()
                  }}
                  className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {userQuery.trim() && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface-elevated">
                  {searchingUsers ? (
                    <p className="px-4 py-3 text-xs text-text-muted">Searching…</p>
                  ) : userSearchError ? (
                    <p role="alert" className="px-4 py-3 text-xs text-error">
                      {userSearchError}
                    </p>
                  ) : userResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-text-muted">
                      No accounts match “{userQuery.trim()}”.
                    </p>
                  ) : (
                    <ul>
                      {userResults.map((candidate) => (
                        <li key={candidate.id}>
                          <button
                            type="button"
                            onClick={() => onPickUser(candidate)}
                            className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-surface"
                          >
                            <span className="text-sm font-semibold">{candidate.name}</span>
                            <span className="text-xs text-text-muted">{candidate.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <label
            htmlFor="guest-name"
            className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
          >
            Guest name
          </label>
          <input
            id="guest-name"
            type="text"
            maxLength={120}
            placeholder="Walk-in or phone caller, e.g. “Mara Santos”"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <p className="mt-1.5 text-[11px] text-text-muted">
            No account needed — the reservation is held under this name.
          </p>
        </div>
      )}
    </fieldset>
  )
}
