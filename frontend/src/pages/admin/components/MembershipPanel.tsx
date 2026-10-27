import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { fetchUserMembership, searchUsers, setUserMembership, type TagUser } from '../../../lib/admin-api'
import { describeBookingError } from '../../../lib/booking-api'
import { formatDay } from '../../../lib/booking-format'

const TIERS = ['free', 'subscriber', 'vip'] as const

export default function MembershipPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TagUser[]>([])
  const [selected, setSelected] = useState<TagUser | null>(null)
  const [tier, setTier] = useState<(typeof TIERS)[number]>('free')
  const [expiresAt, setExpiresAt] = useState('')
  const [current, setCurrent] = useState<{ tier: string; expiresAt: string | null } | null>(null)
  const [loadingMembership, setLoadingMembership] = useState(false)
  const pickRequestId = useRef(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    setError('')
    setFlash('')
    try {
      const { users } = await searchUsers(query.trim())
      setResults(users)
      if (users.length === 0) setError('No accounts match.')
    } catch (err) {
      setError(describeBookingError(err, 'Could not search accounts.'))
    } finally {
      setBusy(false)
    }
  }

  async function handlePick(user: TagUser) {
    setSelected(user)
    setResults([])
    setQuery(user.email)
    setError('')
    setFlash('')
    setCurrent(null)
    setLoadingMembership(true)
    const requestId = ++pickRequestId.current
    try {
      const { membership } = await fetchUserMembership(user.id)
      if (requestId !== pickRequestId.current) return // stale
      setCurrent(membership)
      setTier(membership.tier as (typeof TIERS)[number])
      setExpiresAt(membership.expiresAt ? membership.expiresAt.slice(0, 10) : '')
    } catch (err) {
      if (requestId !== pickRequestId.current) return
      setError(describeBookingError(err, 'Could not load membership.'))
    } finally {
      if (requestId === pickRequestId.current) setLoadingMembership(false)
    }
  }

  async function handleGrant(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError('')
    setFlash('')
    try {
      const { membership } = await setUserMembership(
        selected.id,
        tier,
        expiresAt ? new Date(expiresAt).toISOString() : null,
      )
      setCurrent(membership)
      setFlash(`Updated ${selected.name} to ${membership.tier}.`)
    } catch (err) {
      setError(describeBookingError(err, 'Could not update membership.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div>
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase">Membership</h2>
        <p className="mt-1 text-xs text-text-muted">
          Grant subscriber (ad-free) or VIP (20% off services) tiers to an account.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="membership-query" className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase">
            Account
          </label>
          <input
            id="membership-query"
            type="search"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:text-text-primary disabled:opacity-60"
        >
          Search
        </button>
      </form>

      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => handlePick(user)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-left text-sm transition hover:border-primary/40"
              >
                <span className="font-semibold text-text-primary">{user.name}</span>
                <span className="ml-2 text-xs text-text-muted">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <form onSubmit={handleGrant} className="space-y-3 rounded-lg border border-border bg-surface-elevated p-3">
          <p className="text-sm font-semibold text-text-primary">{selected.name}</p>
          {current && (
            <p className="text-xs text-text-muted">
              Current: {current.tier}
              {current.expiresAt ? ` (expires ${formatDay(current.expiresAt.slice(0, 10))})` : ''}
            </p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="membership-tier" className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase">
                Tier
              </label>
              <select
                id="membership-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as (typeof TIERS)[number])}
                className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {TIERS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="membership-expiry" className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase">
                Expires (optional)
              </label>
              <input
                id="membership-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy || loadingMembership}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? 'Saving…' : loadingMembership ? 'Loading…' : 'Grant tier'}
            </button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {flash && (
        <p role="status" className="flex items-start gap-2.5 text-sm text-success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
          {flash}
        </p>
      )}
    </section>
  )
}
