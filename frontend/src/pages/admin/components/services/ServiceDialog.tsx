import { useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AddInvoiceIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createAdminService,
  updateAdminService,
  type AdminService,
} from '../../../../lib/admin-api'
import { describeBookingError } from '../../../../lib/booking-api'
import { WING_LABELS } from '../../../studio/components/booking/constants'

type ServiceDialogProps = {
  /** null = create a new service, otherwise edit this row. */
  service: AdminService | null
  onOpenChange: (open: boolean) => void
  onSaved: (service: AdminService) => void
}

const FIELD_CLASSES =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary'
const LABEL_CLASSES = 'text-[10px] font-bold tracking-widest text-text-muted uppercase'

export default function ServiceDialog({ service, onOpenChange, onSaved }: ServiceDialogProps) {
  const editing = service !== null
  const [name, setName] = useState(service?.name ?? '')
  const [wing, setWing] = useState(service?.wing ?? 'create')
  const [unit, setUnit] = useState(service?.unit ?? '')
  const [price, setPrice] = useState(service ? String(service.pricePhp) : '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const pricePhp = Number(price)
    if (!editing && !name.trim()) {
      setError('Give the service a name.')
      return
    }
    if (!editing && !unit.trim()) {
      setError('Set the billing unit (e.g. "Per Hour").')
      return
    }
    if (!description.trim()) {
      setError('Add a short description the customer will see.')
      return
    }
    if (!Number.isFinite(pricePhp) || pricePhp < 0 || price.trim() === '') {
      setError('Enter a valid price in pesos.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const result = editing
        ? await updateAdminService(service.id, { description, pricePhp })
        : await createAdminService({
            name,
            wing,
            unit,
            pricePhp,
            description,
          })
      onSaved(result.service)
      onOpenChange(false)
    } catch (err) {
      setError(describeBookingError(err, 'The service could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] border border-border bg-surface p-0 text-text-primary sm:max-w-lg">
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated">
            <HugeiconsIcon
              icon={editing ? PencilEdit02Icon : AddInvoiceIcon}
              size={16}
              className="text-primary"
            />
          </span>
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold tracking-wide">
              {editing ? 'Edit service' : 'New service'}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
              {editing
                ? 'Update the description and price customers see.'
                : 'Add a service to the public catalog.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {editing ? (
            <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2">
              <p className={LABEL_CLASSES}>Service</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">{service.name}</p>
              <p className="text-xs text-text-muted">
                {WING_LABELS[service.wing] ?? service.wing} · {service.unit}
              </p>
            </div>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className={LABEL_CLASSES}>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={120}
                  placeholder="e.g. Vocal Coaching"
                  className={FIELD_CLASSES}
                  autoFocus
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className={LABEL_CLASSES}>Wing</span>
                  <select
                    value={wing}
                    onChange={(event) => setWing(event.target.value)}
                    className={FIELD_CLASSES}
                  >
                    {Object.entries(WING_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className={LABEL_CLASSES}>Billing unit</span>
                  <input
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                    maxLength={60}
                    placeholder="e.g. Per Hour"
                    className={FIELD_CLASSES}
                  />
                </label>
              </div>
            </>
          )}

          <label className="block space-y-1.5">
            <span className={LABEL_CLASSES}>Price (PHP)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0.00"
              className={FIELD_CLASSES}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={LABEL_CLASSES}>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="What the customer gets, in one or two sentences."
              className={`${FIELD_CLASSES} resize-y`}
            />
          </label>

          {error && (
            <p role="alert" className="text-xs text-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:bg-surface-elevated disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
