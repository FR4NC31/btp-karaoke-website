import { useEffect, useRef, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Calendar01Icon, CloudUploadIcon } from '@hugeicons/core-free-icons'
import type { PublicBlockout, Service } from '../../../../lib/booking-api'
import {
  BLOCKOUT_REASON_LABELS,
  isHourlyService,
  isTimeBasedService,
} from '../../../../lib/booking-api'
import { peso } from '../../../../lib/booking-format'
import { HOUR_OPTIONS, NOTES_MAX } from '../../../../lib/booking-constants'
import { Calendar } from '../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { WING_LABELS } from './constants'

/** The receipt dropzone accepts images up to 10 MB. The server's upload
 *  ceiling is much higher (200 MB by default), so this is a client-side
 *  convenience limit for receipts, not a mirrored policy. */
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024

/** `YYYY-MM-DD` → a local Date (built in local time, so no UTC off-by-one). */
function isoToDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Local Date → `YYYY-MM-DD`. */
function dateToIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The trigger's display text, matching the mockup's `11/05/2026`. */
function pickerLabel(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

export type PaymentChoice = '' | 'filler' | 'gcash'

type BookingFormProps = {
  service: Service
  /** `create` collects payment; `reschedule` only moves an existing slot. */
  mode?: 'create' | 'reschedule'
  studioToday: string
  bookingDate: string
  onDateChange: (value: string) => void
  bookingTime: string
  onTimeChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
  /** ISO days the studio is closed — unselectable in the calendar. */
  blockedDates: string[]
  /** `''` until the customer picks In Person (filler) or GCash. */
  paymentMethod: PaymentChoice
  onPaymentMethodChange: (value: PaymentChoice) => void
  receipt: File | null
  onReceiptChange: (file: File | null) => void
  /** Set when the chosen day is closed; the form refuses to submit. */
  blockout: PublicBlockout | null
  formError: string
  submitting: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const FIELD_CLASSES =
  'mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none'

const LABEL_CLASSES = 'block text-sm font-semibold text-text-primary'

function methodChip(active: boolean): string {
  return `flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background ${
    active
      ? 'border-primary bg-primary/10 text-text-primary'
      : 'border-border bg-background text-text-secondary hover:border-primary/40 hover:text-text-primary'
  }`
}

/**
 * The booking modal from the booking-desk mockup: date + time slot + notes,
 * then the payment method (GCash / In Person) with the GCash receipt dropzone,
 * all confirmed in one **Confirm Booking** submit — no separate review step.
 * The date field is a shadcn/ui Calendar in a popover (react-day-picker):
 * past days and studio blockouts are disabled, month/year dropdowns jump
 * straight to far-future bookings. `mode="reschedule"` (Change Schedule)
 * hides the payment block: moving an existing slot must not ask the customer
 * to pay again.
 */
export default function BookingForm({
  service,
  mode = 'create',
  studioToday,
  bookingDate,
  onDateChange,
  bookingTime,
  onTimeChange,
  notes,
  onNotesChange,
  blockedDates,
  paymentMethod,
  onPaymentMethodChange,
  receipt,
  onReceiptChange,
  blockout,
  formError,
  submitting,
  onClose,
  onSubmit,
}: BookingFormProps) {
  const timeBased = isTimeBasedService(service)
  const hourly = isHourlyService(service)
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const [dateOpen, setDateOpen] = useState(false)

  // The calendar's bounds: today (studio timezone) through three years out —
  // far enough for every bookable session, short enough to keep the year
  // dropdown honest.
  const minDate = isoToDate(studioToday)
  const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const endMonth = new Date(minDate.getFullYear(), minDate.getMonth() + 36, 1)

  // Own the blob URL lifecycle for the receipt preview: create it when a file
  // is chosen, revoke it on replacement/unmount so Strict Mode and navigation
  // don't leak object URLs.
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!receipt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiptPreview(null)
      return
    }
    const url = URL.createObjectURL(receipt)
    setReceiptPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [receipt])

  function acceptReceipt(file: File | null | undefined) {
    setReceiptError('')
    if (!file) return
    const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
    const acceptedExt = new Set(['.jpg', '.jpeg', '.png', '.webp'])
    const acceptedMime = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!acceptedExt.has(ext) || !acceptedMime.has(file.type.toLowerCase())) {
      setReceiptError('Receipt must be a JPG, PNG or WebP image.')
      return
    }
    if (file.size > RECEIPT_MAX_BYTES) {
      setReceiptError('Receipt must be 10 MB or smaller.')
      return
    }
    onReceiptChange(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-form-heading"
        className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <HugeiconsIcon icon={Calendar01Icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="booking-form-heading" className="text-lg leading-tight font-bold">
              {service.name}
            </h2>
            <p className="mt-1 text-[11px] font-bold tracking-widest text-primary uppercase">
              {WING_LABELS[service.wing] ?? service.wing}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {service.unit} · {peso.format(service.pricePhp)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking form"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="booking-date" id="booking-date-label" className={LABEL_CLASSES}>
              Select Date <span className="text-primary">*</span>
            </label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id="booking-date"
                  aria-labelledby="booking-date-label booking-date-value"
                  aria-describedby={blockout ? 'booking-date-closed' : undefined}
                  className={`${FIELD_CLASSES} flex cursor-pointer items-center justify-between gap-2 text-left`}
                >
                  <span id="booking-date-value" className="tabular-nums">
                    {bookingDate ? pickerLabel(bookingDate) : 'Pick a date'}
                  </span>
                  <HugeiconsIcon icon={Calendar01Icon} size={16} className="shrink-0 text-text-muted" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-2">
                <Calendar
                  mode="single"
                  selected={bookingDate ? isoToDate(bookingDate) : undefined}
                  onSelect={(date) => {
                    // Keep the required date: clicking the selected day again
                    // reports `undefined`, which must not clear the field.
                    if (!date) return
                    onDateChange(dateToIso(date))
                    setDateOpen(false)
                  }}
                  captionLayout="dropdown"
                  startMonth={startMonth}
                  endMonth={endMonth}
                  disabled={[
                    { before: minDate },
                    ...blockedDates.map(isoToDate),
                  ]}
                />
              </PopoverContent>
            </Popover>
            {blockout ? (
              <p
                id="booking-date-closed"
                role="alert"
                className="mt-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error"
              >
                The studio is unavailable on this day
                {blockout.reason ? ` (${BLOCKOUT_REASON_LABELS[blockout.reason]})` : ''}. Pick
                another date.
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-text-muted">
                {timeBased
                  ? 'Pick the day for your session.'
                  : 'Whole day. One live booking per customer, per service, per day.'}
              </p>
            )}
          </div>

          {timeBased && (
            <div>
              <label htmlFor="booking-time" className={LABEL_CLASSES}>
                Select Time Slot <span className="text-primary">*</span>
              </label>
              {hourly ? (
                <select
                  id="booking-time"
                  required
                  value={bookingTime}
                  onChange={(event) => onTimeChange(event.target.value)}
                  className={FIELD_CLASSES}
                >
                  <option value="">Select a time slot</option>
                  {HOUR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="booking-time"
                  type="time"
                  required
                  value={bookingTime}
                  onChange={(event) => onTimeChange(event.target.value)}
                  className={FIELD_CLASSES}
                />
              )}
              <p className="mt-1.5 text-[11px] text-text-muted">
                {hourly
                  ? 'Whole-hour blocks (e.g. 1:00 PM–2:00 PM) — studio (PH) timezone.'
                  : '24-hour clock — time is in studio (PH) timezone'}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="booking-notes" className={LABEL_CLASSES}>
              Session Notes (Optional)
            </label>
            <textarea
              id="booking-notes"
              rows={3}
              maxLength={NOTES_MAX}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="e.g. Bring custom vocal mic preset, track references..."
              className={`${FIELD_CLASSES} resize-y placeholder:text-text-muted`}
            />
          </div>

          {mode === 'create' && (
            <>
              <div>
                <p className={LABEL_CLASSES} id="payment-method-label">
                  Payment Method <span className="text-primary">*</span>
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby="payment-method-label"
                  className="mt-2 flex flex-col gap-3 sm:flex-row"
                >
                  <label className={methodChip(paymentMethod === 'gcash')}>
                    <input
                      type="radio"
                      name="payment-method"
                      value="gcash"
                      checked={paymentMethod === 'gcash'}
                      onChange={() => onPaymentMethodChange('gcash')}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                        paymentMethod === 'gcash' ? 'border-primary' : 'border-text-muted'
                      }`}
                    >
                      {paymentMethod === 'gcash' && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </span>
                    GCash
                  </label>

                  <label className={methodChip(paymentMethod === 'filler')}>
                    <input
                      type="radio"
                      name="payment-method"
                      value="filler"
                      checked={paymentMethod === 'filler'}
                      onChange={() => onPaymentMethodChange('filler')}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                        paymentMethod === 'filler' ? 'border-primary' : 'border-text-muted'
                      }`}
                    >
                      {paymentMethod === 'filler' && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </span>
                    In Person
                  </label>
                </div>
              </div>

              {paymentMethod === 'gcash' && (
                <div>
                  <p className={LABEL_CLASSES}>
                    Upload GCash Payment Receipt <span className="text-primary">*</span>{' '}
                    <span className="text-xs font-normal text-text-muted">
                      (JPG, PNG - Max 10MB)
                    </span>
                  </p>

                  {receipt ? (
                    <div className="mt-2 space-y-2 rounded-xl border border-border bg-background p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={receiptPreview ?? undefined}
                          alt="Receipt preview"
                          className="size-16 rounded-lg border border-border object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-text-secondary">{receipt.name}</p>
                          <p className="text-[11px] text-text-muted">
                            {(receipt.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => receiptInputRef.current?.click()}
                          className="font-semibold text-text-secondary underline-offset-4 transition hover:text-text-primary hover:underline"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptError('')
                            onReceiptChange(null)
                          }}
                          className="font-semibold text-text-secondary underline-offset-4 transition hover:text-error hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => receiptInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          receiptInputRef.current?.click()
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragging(true)
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault()
                        setDragging(false)
                        acceptReceipt(event.dataTransfer.files?.[0])
                      }}
                      className={`mt-2 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
                        dragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/60'
                      }`}
                    >
                      <HugeiconsIcon icon={CloudUploadIcon} size={26} className="text-text-muted" />
                      <p className="text-sm font-semibold text-text-primary">
                        Click or drag receipt image here
                      </p>
                      <p className="text-xs text-text-muted">Supports JPG, PNG up to 10MB</p>
                    </div>
                  )}

                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      acceptReceipt(event.target.files?.[0])
                      // Allow re-selecting the same file later.
                      event.target.value = ''
                    }}
                  />
                  {receiptError && (
                    <p role="alert" className="mt-2 text-xs text-error">
                      {receiptError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-2.5 text-sm font-semibold text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting ||
              Boolean(blockout) ||
              (mode === 'create' &&
                (!paymentMethod || (paymentMethod === 'gcash' && !receipt)))
            }
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Confirming…' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  )
}
