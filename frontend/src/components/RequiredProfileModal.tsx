import { useState, useEffect, useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PhoneIcon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { authClient, useSession } from '../lib/auth-client'
import { readableError, unexpectedError } from '../lib/auth-errors'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { getProvinces, getCitiesMunicipalities, getBarangays, type PhLocationOption } from '../lib/ph-locations'

type RequiredProfileModalProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  forceOpen?: boolean
}

const PH_MOBILE_REGEX = /^(09\d{9}|\+639\d{9})$/

export default function RequiredProfileModal({ open: externalOpen, onOpenChange, forceOpen = false }: RequiredProfileModalProps) {
  const { data, refetch } = useSession()
  const user = data?.user

  // Check missing required profile details (trimming whitespace-only names)
  const missingPhone = !user?.contact_num || user.contact_num.trim() === '' || user.contact_num === 'Not set' || !PH_MOBILE_REGEX.test(user.contact_num.trim())
  const missingProvince = !user?.province || user.province.trim() === ''
  const missingCity = !user?.city_municipality || user.city_municipality.trim() === ''
  const missingBarangay = !user?.barangay || user.barangay.trim() === ''
  const missingName = !user?.first_name || user.first_name.trim() === '' || !user?.last_name || user.last_name.trim() === ''

  const isMissingRequirements = Boolean(user) && (missingPhone || missingProvince || missingCity || missingBarangay || missingName)

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const isOpen = isControlled ? externalOpen : (forceOpen || (isMissingRequirements && internalOpen))

  const [prevUserLoaded, setPrevUserLoaded] = useState<string | null>(null)
  if (user?.id && user.id !== prevUserLoaded) {
    setPrevUserLoaded(user.id)
    if (isMissingRequirements && !isControlled) {
      setInternalOpen(true)
    }
  }

  function handleOpenChange(value: boolean) {
    // Non-dismissible while requirements remain missing (unless forceOpen is true)
    if (!value && isMissingRequirements && !forceOpen) {
      return
    }
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  const [prevUserId, setPrevUserId] = useState(user?.id)
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [contactNum, setContactNum] = useState(user?.contact_num ?? '')
  
  const [provinces, setProvinces] = useState<PhLocationOption[]>([])
  const [provinceName, setProvinceName] = useState(user?.province ?? '')
  const [cityName, setCityName] = useState(user?.city_municipality ?? '')
  const [barangayName, setBarangayName] = useState(user?.barangay ?? '')

  const [loadedCities, setLoadedCities] = useState<PhLocationOption[]>([])
  const [loadedBarangays, setLoadedBarangays] = useState<PhLocationOption[]>([])

  const cities = useMemo(() => (provinceName ? loadedCities : []), [provinceName, loadedCities])
  const barangays = useMemo(() => (cityName ? loadedBarangays : []), [cityName, loadedBarangays])

  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id)
    setFirstName(user?.first_name ?? '')
    setLastName(user?.last_name ?? '')
    setContactNum(user?.contact_num ?? '')
    setProvinceName(user?.province ?? '')
    setCityName(user?.city_municipality ?? '')
    setBarangayName(user?.barangay ?? '')
  }

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    let active = true
    async function loadProvinces() {
      try {
        const list = await getProvinces()
        if (active) {
          setProvinces(list)
          setLocationError('')
        }
      } catch {
        if (active) {
          setLocationError('Failed to load provinces. Please check your connection and retry.')
        }
      }
    }
    void loadProvinces()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!provinceName) return
    const prov = provinces.find((p) => p.name === provinceName)
    if (!prov) return
    const provinceCode = prov.code
    let active = true
    async function loadCities() {
      try {
        const list = await getCitiesMunicipalities(provinceCode)
        if (active) {
          setLoadedCities(list)
          setLocationError('')
        }
      } catch {
        if (active) {
          setLoadedCities([])
          setLocationError('Failed to load cities/municipalities. Please retry.')
        }
      }
    }
    void loadCities()
    return () => {
      active = false
    }
  }, [provinceName, provinces])

  useEffect(() => {
    if (!cityName) return
    const city = cities.find((c) => c.name === cityName)
    if (!city) return
    const cityCode = city.code
    let active = true
    async function loadBarangays() {
      try {
        const list = await getBarangays(cityCode)
        if (active) {
          setLoadedBarangays(list)
          setLocationError('')
        }
      } catch {
        if (active) {
          setLoadedBarangays([])
          setLocationError('Failed to load barangays. Please retry.')
        }
      }
    }
    void loadBarangays()
    return () => {
      active = false
    }
  }, [cityName, cities])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedContact = contactNum.trim()

    if (!trimmedFirst || !trimmedLast || !trimmedContact || !provinceName || !cityName || !barangayName) {
      setError('Please fill in all required profile details (Name, Mobile Number, and complete Address).')
      return
    }

    if (!PH_MOBILE_REGEX.test(trimmedContact)) {
      setError('Please enter a valid Philippine mobile number (e.g., 09171234567 or +639171234567).')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await authClient.updateUser({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        contact_num: trimmedContact,
        province: provinceName,
        city_municipality: cityName,
        barangay: barangayName,
      })

      if (updateError) {
        setError(readableError(updateError))
        return
      }

      await refetch()
      handleOpenChange(false)
    } catch (err) {
      setError(unexpectedError('profile update', err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="border border-border bg-surface text-text-primary sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/20 text-primary">
              <HugeiconsIcon icon={InformationCircleIcon} size={20} />
            </span>
            <DialogTitle className="text-lg">Required Profile Details</DialogTitle>
          </div>
          <DialogDescription className="text-text-secondary">
            Your account is missing required information. Please complete your mobile number and address details to continue using studio reservations and room queues.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-2.5 text-xs text-error">
            {error}
          </p>
        )}

        {locationError && (
          <div role="alert" className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-xs text-warning">
            <span>{locationError}</span>
            <button
              type="button"
              onClick={() => {
                setLocationError('')
                void getProvinces().then(setProvinces).catch(() => setLocationError('Failed to load provinces.'))
              }}
              className="ml-2 rounded bg-warning/20 px-2 py-1 font-semibold hover:bg-warning/35 transition"
            >
              Retry
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="required-first-name" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                First Name <span className="text-primary">*</span>
              </label>
              <input
                id="required-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="required-last-name" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Last Name <span className="text-primary">*</span>
              </label>
              <input
                id="required-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="required-contact" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Mobile Number / Contact <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <HugeiconsIcon icon={PhoneIcon} size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
              <input
                id="required-contact"
                type="tel"
                value={contactNum}
                onChange={(e) => setContactNum(e.target.value)}
                required
                placeholder="09171234567 or +639171234567"
                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Must be 11 digits starting with 09 or +639 format.</p>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Address Location</p>
            
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="required-province" className="block text-[11px] font-semibold text-text-secondary mb-1">Province *</label>
                <select
                  id="required-province"
                  value={provinceName}
                  onChange={(e) => {
                    setProvinceName(e.target.value)
                    setCityName('')
                    setBarangayName('')
                    setLoadedCities([])
                    setLoadedBarangays([])
                  }}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Select Province</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="required-city" className="block text-[11px] font-semibold text-text-secondary mb-1">City / Municipality *</label>
                <select
                  id="required-city"
                  value={cityName}
                  onChange={(e) => {
                    setCityName(e.target.value)
                    setBarangayName('')
                    setLoadedBarangays([])
                  }}
                  required
                  disabled={!provinceName}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="required-barangay" className="block text-[11px] font-semibold text-text-secondary mb-1">Barangay *</label>
                <select
                  id="required-barangay"
                  value={barangayName}
                  onChange={(e) => setBarangayName(e.target.value)}
                  required
                  disabled={!cityName}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => (
                    <option key={b.code} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? 'Saving Details...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
