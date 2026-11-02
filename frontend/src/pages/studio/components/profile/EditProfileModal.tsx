import { useEffect, useRef, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MapPinIcon } from '@hugeicons/core-free-icons'
import { authClient } from '../../../../lib/auth-client'
import { readableError, unexpectedError } from '../../../../lib/auth-errors'
import {
  getBarangays,
  getCitiesMunicipalities,
  getProvinces,
  type PhLocationOption,
} from '../../../../lib/ph-locations'
import type { ProfileIdentity } from './types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'

type EditProfileModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  identity: ProfileIdentity
  onSaved: () => void | Promise<void>
}

const SELECT_CLASSES =
  'w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-text-primary outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60'

export default function EditProfileModal({ open, onOpenChange, identity, onSaved }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(identity.fullName.split(' ')[0] ?? '')
  const [lastName, setLastName] = useState(identity.fullName.split(' ').slice(1).join(' ') ?? '')
  const [contact, setContact] = useState(identity.phone === 'Not set' ? '' : identity.phone.replace(/\D/g, ''))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')

  const [provinces, setProvinces] = useState<PhLocationOption[]>([])
  const [cities, setCities] = useState<PhLocationOption[]>([])
  const [barangays, setBarangays] = useState<PhLocationOption[]>([])
  const [provinceCode, setProvinceCode] = useState('')
  const [cityCode, setCityCode] = useState('')
  const [barangayCode, setBarangayCode] = useState('')
  const [provincesLoading, setProvincesLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [barangaysLoading, setBarangaysLoading] = useState(false)

  const prefill = useRef({ province: true, city: true, barangay: true })

  // Reset form whenever the modal opens.
  useEffect(() => {
    if (!open) return
    setFirstName(identity.fullName.split(' ')[0] ?? '')
    setLastName(identity.fullName.split(' ').slice(1).join(' ') ?? '')
    setContact(identity.phone === 'Not set' ? '' : identity.phone.replace(/\D/g, ''))
    setSaveError('')
    setLoadError('')
    prefill.current = { province: true, city: true, barangay: true }
    setProvinceCode('')
    setCityCode('')
    setBarangayCode('')
    setCities([])
    setBarangays([])
  }, [open, identity])

  useEffect(() => {
    if (!open) return
    let alive = true
    async function load() {
      setProvincesLoading(true)
      setLoadError('')
      try {
        const options = await getProvinces()
        if (!alive) return
        setProvinces(options)
        if (prefill.current.province) {
          prefill.current.province = false
          const match = options.find((option) => option.name === identity.location.province)
          if (match) setProvinceCode(match.code)
        }
      } catch {
        if (!alive) return
        setLoadError('Could not load Philippine provinces. Check your connection and try again.')
      } finally {
        if (alive) setProvincesLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
      setProvincesLoading(false)
    }
  }, [open, identity.location.province])

  useEffect(() => {
    if (!open || !provinceCode) return
    let alive = true
    async function load() {
      setCitiesLoading(true)
      setLoadError('')
      try {
        const options = await getCitiesMunicipalities(provinceCode)
        if (!alive) return
        setCities(options)
        if (prefill.current.city) {
          prefill.current.city = false
          const match = options.find((option) => option.name === identity.location.cityMunicipality)
          if (match) setCityCode(match.code)
        }
      } catch {
        if (!alive) return
        setLoadError('Could not load cities and municipalities. Check your connection and try again.')
      } finally {
        if (alive) setCitiesLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
      setCitiesLoading(false)
    }
  }, [open, provinceCode, identity.location.cityMunicipality])

  useEffect(() => {
    if (!open || !cityCode) return
    let alive = true
    async function load() {
      setBarangaysLoading(true)
      setLoadError('')
      try {
        const options = await getBarangays(cityCode)
        if (!alive) return
        setBarangays(options)
        if (prefill.current.barangay) {
          prefill.current.barangay = false
          const match = options.find((option) => option.name === identity.location.barangay)
          if (match) setBarangayCode(match.code)
        }
      } catch {
        if (!alive) return
        setLoadError('Could not load barangays. Check your connection and try again.')
      } finally {
        if (alive) setBarangaysLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
      setBarangaysLoading(false)
    }
  }, [open, cityCode, identity.location.barangay])

  function handleProvinceChange(code: string) {
    if (code === provinceCode) return
    prefill.current.city = false
    prefill.current.barangay = false
    setProvinceCode(code)
    setCityCode('')
    setBarangayCode('')
    setCities([])
    setBarangays([])
    setLoadError('')
  }

  function handleCityChange(code: string) {
    if (code === cityCode) return
    prefill.current.barangay = false
    setCityCode(code)
    setBarangayCode('')
    setBarangays([])
    setLoadError('')
  }

  function handleBarangayChange(code: string) {
    setBarangayCode(code)
    setLoadError('')
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setSaveError('First and last name are required.')
      return
    }
    if (!/^\d{11}$/.test(contact)) {
      setSaveError('Contact number must be exactly 11 digits.')
      return
    }

    const province = provinces.find((option) => option.code === provinceCode)
    const city = cities.find((option) => option.code === cityCode)
    const barangay = barangays.find((option) => option.code === barangayCode)

    if (!province || !city || !barangay) {
      setSaveError('Choose a province, city or municipality, and barangay before saving.')
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      const { error } = await authClient.updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_num: contact,
        province: province.name,
        city_municipality: city.name,
        barangay: barangay.name,
      })
      if (error) {
        setSaveError(readableError(error))
        return
      }
      onOpenChange(false)
      await onSaved()
    } catch (err) {
      setSaveError(unexpectedError('profile update', err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-border bg-surface text-text-primary sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Update your personal information and location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Contact number</label>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="09XXXXXXXXX"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Email</label>
              <input
                value={identity.email}
                disabled
                className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-text-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={MapPinIcon} size={16} className="text-primary" />
            <h3 className="font-heading text-sm font-bold tracking-widest uppercase">Location</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Province</label>
              <select
                value={provinceCode}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={saving || provincesLoading}
                className={SELECT_CLASSES}
              >
                <option value="">{provincesLoading ? 'Loading…' : 'Select a province'}</option>
                {provinces.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">City / Municipality</label>
              <select
                value={cityCode}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={saving || !provinceCode || citiesLoading}
                className={SELECT_CLASSES}
              >
                <option value="">{citiesLoading ? 'Loading…' : provinceCode ? 'Select a city / municipality' : 'Select a province first'}</option>
                {cities.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Barangay</label>
              <select
                value={barangayCode}
                onChange={(e) => handleBarangayChange(e.target.value)}
                disabled={saving || !cityCode || barangaysLoading}
                className={SELECT_CLASSES}
              >
                <option value="">{barangaysLoading ? 'Loading…' : cityCode ? 'Select a barangay' : 'Select a city / municipality first'}</option>
                {barangays.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadError && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
              <span>{loadError}</span>
            </div>
          )}
          {saveError && <p role="alert" className="text-sm text-error">{saveError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || provincesLoading || citiesLoading || barangaysLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
