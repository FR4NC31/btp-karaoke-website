import { useEffect, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon } from '@hugeicons/core-free-icons'
import { fetchContactDetails, setContactDetails, type ContactDetails } from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'

const FIELD_CLASSES =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary'
const LABEL_CLASSES = 'text-[10px] font-bold tracking-widest text-text-muted uppercase'

const DEFAULTS: ContactDetails = {
  facebookUrl: 'https://www.facebook.com/profile.php?id=61560004453465',
  facebookLabel: 'BTP Music Production',
  email: 'btpproduction2024@gmail.com',
  phone: '0932 973 6975',
  phoneHref: 'tel:+639329736975',
  address: '',
}

export default function AdminContact() {
  const [form, setForm] = useState<ContactDetails>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    let alive = true
    fetchContactDetails()
      .then((result) => {
        if (!alive) return
        if (result.details) setForm({ ...DEFAULTS, ...result.details })
      })
      .catch((err) => {
        if (alive) setError(describeBookingError(err, 'Could not load the contact details.'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  function update<K extends keyof ContactDetails>(key: K, value: ContactDetails[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Email, phone and address are required.')
      return
    }
    setSaving(true)
    setError('')
    setSaved('')
    try {
      const result = await setContactDetails(form)
      setForm({ ...DEFAULTS, ...result.details })
      setSaved('Contact details saved. They are now live on the site.')
    } catch (err) {
      setError(describeBookingError(err, 'The contact details could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <HugeiconsIcon icon={Mail01Icon} size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-bold tracking-widest uppercase">
              Contact details
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              The phone, email and address customers see on the Contact page and
              footer. Changes go live immediately.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-text-muted">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block space-y-1.5">
              <span className={LABEL_CLASSES}>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={FIELD_CLASSES}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={LABEL_CLASSES}>Phone (display)</span>
                <input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="0932 973 6975"
                  className={FIELD_CLASSES}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={LABEL_CLASSES}>Phone link (tel:)</span>
                <input
                  value={form.phoneHref}
                  onChange={(e) => update('phoneHref', e.target.value)}
                  placeholder="tel:+639329736975"
                  className={FIELD_CLASSES}
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className={LABEL_CLASSES}>Address</span>
              <textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                rows={3}
                placeholder="Studio address customers can visit"
                className={`${FIELD_CLASSES} resize-y`}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={LABEL_CLASSES}>Facebook URL</span>
                <input
                  value={form.facebookUrl}
                  onChange={(e) => update('facebookUrl', e.target.value)}
                  className={FIELD_CLASSES}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={LABEL_CLASSES}>Facebook label</span>
                <input
                  value={form.facebookLabel}
                  onChange={(e) => update('facebookLabel', e.target.value)}
                  className={FIELD_CLASSES}
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="text-xs text-error">
                {error}
              </p>
            )}
            {saved && (
              <p role="status" className="text-xs text-success">
                {saved}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save contact details'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}