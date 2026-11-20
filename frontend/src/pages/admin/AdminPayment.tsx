import { useEffect, useState, type ChangeEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CreditCardIcon, QrCode01Icon } from '@hugeicons/core-free-icons'
import { fetchGcashQr, setGcashQrUrl, uploadAdminMediaFile } from '../../lib/admin-api'

/** QR codes are small; keep the admin upload well under the media ceiling. */
const QR_MAX_BYTES = 5 * 1024 * 1024
const QR_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const QR_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * /admin/payments — the studio's payment method: the GCash QR code customers
 * scan at checkout. Saving uploads the image through the media uploader, then
 * stores its URL in `site_setting` for the public checkout to read.
 */
export default function AdminPayment() {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    let alive = true
    fetchGcashQr()
      .then((result) => {
        if (alive) setQrUrl(result.url)
      })
      .catch(() => {
        if (alive) setError('Could not load the current QR code.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // Own the blob URL lifecycle for the chosen image.
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setError('')
    setSaved('')
    const picked = event.target.files?.[0]
    // Allow re-selecting the same file later.
    event.target.value = ''
    if (!picked) return
    const ext = picked.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
    if (!QR_EXTENSIONS.has(ext) || !QR_MIMES.has(picked.type.toLowerCase())) {
      setError('The QR code must be a JPG, PNG or WebP image.')
      return
    }
    if (picked.size > QR_MAX_BYTES) {
      setError('The QR code must be 5 MB or smaller.')
      return
    }
    setFile(picked)
  }

  async function handleSave() {
    if (!file || saving) return
    setSaving(true)
    setError('')
    setSaved('')
    try {
      const { file: stored } = await uploadAdminMediaFile(file)
      const result = await setGcashQrUrl(stored.url)
      setQrUrl(result.url)
      setFile(null)
      setSaved('QR code saved. Customers now see it at GCash checkout.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The QR code could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const shownUrl = preview ?? qrUrl

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <HugeiconsIcon icon={CreditCardIcon} size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-bold tracking-widest uppercase">
              Payment method
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Customers pay by scanning this GCash QR code at checkout, then upload their
              receipt. Replace the image whenever your account changes.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-elevated p-4">
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            GCash QR code
          </p>

          {loading ? (
            <p className="mt-3 text-sm text-text-muted">Loading…</p>
          ) : shownUrl ? (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <img
                src={shownUrl}
                alt="Current GCash QR code"
                className="size-40 rounded-lg border border-border bg-white object-contain"
              />
              <p className="max-w-xs text-xs text-text-muted">
                {preview
                  ? 'New image selected — save to publish it to checkout.'
                  : 'This is what customers see at GCash checkout.'}
              </p>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
              <HugeiconsIcon icon={QrCode01Icon} size={16} />
              No QR code yet — upload one so customers can pay by GCash.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              id="gcash-qr"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/*"
              onChange={chooseFile}
              className="block w-full max-w-xs cursor-pointer text-xs text-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-primary file:transition hover:file:bg-primary-hover"
            />
            <label htmlFor="gcash-qr" className="sr-only">
              GCash QR code image (JPG, PNG or WebP)
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={!file || saving}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save QR code'}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-xs text-error">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="mt-3 text-xs text-success">
              {saved}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
