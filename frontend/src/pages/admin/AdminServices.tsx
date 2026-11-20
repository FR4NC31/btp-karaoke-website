import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AddInvoiceIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { fetchAdminServices, type AdminService } from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { peso } from '../../lib/booking-format'
import { WING_LABELS } from '../studio/components/booking/constants'
import ServiceDialog from './components/services/ServiceDialog'

/**
 * /admin/services — the priced catalog customers book from. Editing is limited
 * to the description and price; adding a new service creates the row the
 * public /services page reads (and the booking flow offers).
 */
export default function AdminServices() {
  const [services, setServices] = useState<AdminService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminService | null>(null)

  useEffect(() => {
    let alive = true
    fetchAdminServices()
      .then((result) => {
        if (alive) setServices(result.services)
      })
      .catch((err) => {
        if (alive) setError(describeBookingError(err, 'Could not load the services.'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(service: AdminService) {
    setEditing(service)
    setDialogOpen(true)
  }

  function handleSaved(saved: AdminService) {
    setServices((rows) =>
      rows.some((row) => row.id === saved.id)
        ? rows.map((row) => (row.id === saved.id ? saved : row))
        : [...rows, saved],
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <HugeiconsIcon icon={AddInvoiceIcon} size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-sm font-bold tracking-widest uppercase">
                Services
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Edit the description and price customers see, or add a service to the
                catalog. Changes go live on the booking page immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover"
          >
            <HugeiconsIcon icon={AddInvoiceIcon} size={14} />
            Add service
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-text-muted">Loading services…</p>
        ) : error ? (
          <p role="alert" className="mt-5 text-sm text-error">
            {error}
          </p>
        ) : services.length === 0 ? (
          <p className="mt-5 text-sm text-text-muted">
            No services yet. Add the first one to open bookings.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="rounded-lg border border-border bg-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{service.name}</p>
                      {!service.isActive && (
                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {WING_LABELS[service.wing] ?? service.wing} · {service.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-primary">{peso.format(service.pricePhp)}</p>
                    <button
                      type="button"
                      onClick={() => openEdit(service)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold tracking-widest text-text-secondary uppercase transition hover:bg-surface"
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} size={12} />
                      Edit
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{service.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialogOpen && (
        <ServiceDialog
          key={editing?.id ?? 'new'}
          service={editing}
          onOpenChange={setDialogOpen}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
