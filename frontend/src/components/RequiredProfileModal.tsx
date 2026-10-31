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

export default function RequiredProfileModal({ open: externalOpen, onOpenChange, forceOpen = false }: RequiredProfileModalProps) {
  const { data, refetch } = useSession()
  const user = data?.user

  // Check missing required profile details
  const missingPhone = !user?.contact_num || user.contact_num.trim() === '' || user.contact_num === 'Not set'
  const missingProvince = !user?.province || user.province.trim() === ''
  const missingCity = !user?.city_municipality || user.city_municipality.trim() === ''
  const missingBarangay = !user?.barangay || user.barangay.trim() === ''
  const missingName = !user?.first_name || !user?.last_name

  const isMissingRequirements = missingPhone || missingProvince || missingCity || missingBarangay || missingName

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const isOpen = isControlled ? externalOpen : (forceOpen || (isMissingRequirements && internalOpen))
  const [prevMissing, setPrevMissing] = useState(isMissingRequirements)
  if (isMissingRequirements !== prevMissing) {
    setPrevMissing(isMissingRequirements)
    if (isMissingRequirements && !isControlled) {
      setInternalOpen(true)
    }
  }

  function handleOpenChange(value: boolean) {
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

  useEffect(() => {
    async function loadProvinces() {
      try {
        const list = await getProvinces()
        setProvinces(list)
      } catch {
        // Ignore load error
      }
    }
    void loadProvinces()
  }, [])

  useEffect(() => {
    if (!provinceName) return
    const prov = provinces.find((p) => p.name === provinceName)
    if (!prov) return
    const provinceCode = prov.code
    async function loadCities() {
      try {
        const list = await getCitiesMunicipalities(provinceCode)
        setLoadedCities(list)
      } catch {
        // Ignore
      }
    }
    void loadCities()
  }, [provinceName, provinces])

  useEffect(() => {
    if (!cityName) return
    const city = cities.find((c) => c.name === cityName)
    if (!city) return
    const cityCode = city.code
    async function loadBarangays() {
      try {
        const list = await getBarangays(cityCode)
        setLoadedBarangays(list)
      } catch {
        // Ignore
      }
    }
    void loadBarangays()
  }, [cityName, cities])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !contactNum.trim() || !provinceName || !cityName || !barangayName) {
      setError('Please fill in all required profile details (Name, Mobile Number, and complete Address).')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await authClient.updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_num: contactNum.trim(),
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

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                First Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Last Name <span className="text-primary">*</span>
              </label>
              <input
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Mobile Number / Contact <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <HugeiconsIcon icon={PhoneIcon} size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
              <input
                type="tel"
                value={contactNum}
                onChange={(e) => setContactNum(e.target.value)}
                required
                placeholder="09171234567 or +639..."
                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Used for booking confirmations and studio session notifications.</p>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Address Location</p>
            
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Province *</label>
                <select
                  value={provinceName}
                  onChange={(e) => {
                    setProvinceName(e.target.value)
                    setCityName('')
                    setBarangayName('')
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
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">City / Municipality *</label>
                <select
                  value={cityName}
                  onChange={(e) => {
                    setCityName(e.target.value)
                    setBarangayName('')
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
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Barangay *</label>
                <select
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
