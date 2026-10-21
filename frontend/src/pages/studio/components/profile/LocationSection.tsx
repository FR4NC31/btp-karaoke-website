import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MapPinIcon, PencilIcon } from '@hugeicons/core-free-icons'
import { authClient } from '../../../../lib/auth-client'
import { readableError, unexpectedError } from '../../../../lib/auth-errors'
import {
  getBarangays,
  getCitiesMunicipalities,
  getProvinces,
  type PhLocationOption,
} from '../../../../lib/ph-locations'
import type { ProfileLocation } from './types'

type Props = {
  location: ProfileLocation
  onSaved: () => void | Promise<void>
}

type PrefillFlags = {
  province: boolean
  city: boolean
  barangay: boolean
}

const SELECT_CLASSES =
  'w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-text-primary outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60'

export default function LocationSection({ location, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [justSaved, setJustSaved] = useState(false)

  const [provinces, setProvinces] = useState<PhLocationOption[]>([])
  const [cities, setCities] = useState<PhLocationOption[]>([])
  const [barangays, setBarangays] = useState<PhLocationOption[]>([])
  const [provinceCode, setProvinceCode] = useState('')
  const [cityCode, setCityCode] = useState('')
  const [barangayCode, setBarangayCode] = useState('')
  const [provincesLoading, setProvincesLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [barangaysLoading, setBarangaysLoading] = useState(false)

  // Restore the saved names into the dropdowns once per edit session. After
  // that, a province change must never silently re-pick the old city.
  const prefill = useRef<PrefillFlags>({ province: true, city: true, barangay: true })

  const hasLocation = Boolean(location.barangay || location.cityMunicipality || location.province)

  useEffect(() => {
    if (!editing) return
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
          const match = options.find((option) => option.name === location.province)
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
    }
  }, [editing, reloadKey, location.province])

  useEffect(() => {
    if (!editing || !provinceCode) return
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
          const match = options.find((option) => option.name === location.cityMunicipality)
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
    }
  }, [editing, provinceCode, reloadKey, location.cityMunicipality])

  useEffect(() => {
    if (!editing || !cityCode) return
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
          const match = options.find((option) => option.name === location.barangay)
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
    }
  }, [editing, cityCode, reloadKey, location.barangay])

  useEffect(() => {
    if (!justSaved) return
    const timeout = setTimeout(() => setJustSaved(false), 2500)
    return () => clearTimeout(timeout)
  }, [justSaved])

  function beginEdit() {
    prefill.current = { province: true, city: true, barangay: true }
    setProvinceCode('')
    setCityCode('')
    setBarangayCode('')
    setCities([])
    setBarangays([])
    setSaveError('')
    setLoadError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveError('')
    setLoadError('')
  }

  function handleProvinceChange(code: string) {
    // Re-picking the current province must not wipe the city list: the
    // province effect will not run again for an unchanged value, so the
    // dropdowns would stay empty with no way to recover.
    if (code === provinceCode) return
    // The saved city/barangay belong to the old province; never carry the
    // prefill into a province the person just chose.
    prefill.current.city = false
    prefill.current.barangay = false
    setProvinceCode(code)
    setCityCode('')
    setBarangayCode('')
    setCities([])
    setBarangays([])
  }

  function handleCityChange(code: string) {
    if (code === cityCode) return
    prefill.current.barangay = false
    setCityCode(code)
    setBarangayCode('')
    setBarangays([])
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()

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
        province: province.name,
        city_municipality: city.name,
        barangay: barangay.name,
      })

      if (error) {
        setSaveError(readableError(error))
        return
      }

      // Close the editor before the parent refetch changes `location`; that
      // keeps the load effects from firing again for the new prop values.
      setEditing(false)
      setJustSaved(true)
      await onSaved()
    } catch (err) {
      setSaveError(unexpectedError('location update', err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="location-heading" className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={MapPinIcon} size={18} className="text-primary" />
          <h2
            id="location-heading"
            className="font-heading text-lg font-bold tracking-widest uppercase"
          >
            Location
          </h2>
          {justSaved && (
            <span
              role="status"
              className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-success uppercase"
            >
              Location saved
            </span>
          )}
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={beginEdit}
            className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
          >
            <HugeiconsIcon icon={PencilIcon} size={13} />
            {hasLocation ? 'Edit location' : 'Add location'}
          </button>
        ) : (
          <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            Philippines
          </span>
        )}
      </div>

      {!editing ? (
        <>
          {hasLocation ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <LocationValue label="Barangay" value={location.barangay} />
              <LocationValue label="City / Municipality" value={location.cityMunicipality} />
              <LocationValue label="Province" value={location.province} />
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-border bg-surface-elevated p-4 text-sm text-text-muted">
              No location yet. Add your barangay, city or municipality, and province so BTP can
              suggest nearby rooms and sessions.
            </p>
          )}
          <p className="mt-3 text-[11px] text-text-muted">
            Barangay, city or municipality, and province only — no street address is stored.
          </p>
        </>
      ) : (
        <form onSubmit={handleSave} className="mt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              id="location-province"
              label="Province"
              value={provinceCode}
              onChange={handleProvinceChange}
              options={provinces}
              placeholder="Select a province"
              loading={provincesLoading}
              disabled={saving}
            />
            <SelectField
              id="location-city"
              label="City / Municipality"
              value={cityCode}
              onChange={handleCityChange}
              options={cities}
              placeholder={provinceCode ? 'Select a city / municipality' : 'Select a province first'}
              loading={citiesLoading}
              disabled={!provinceCode || saving}
            />
            <SelectField
              id="location-barangay"
              label="Barangay"
              value={barangayCode}
              onChange={setBarangayCode}
              options={barangays}
              placeholder={cityCode ? 'Select a barangay' : 'Select a city / municipality first'}
              loading={barangaysLoading}
              disabled={!cityCode || saving}
            />
          </div>

          {loadError && (
            <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-error">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="font-semibold underline underline-offset-2 hover:text-error/80"
              >
                Retry
              </button>
            </div>
          )}

          {saveError && (
            <p role="alert" className="mt-4 text-sm text-error">
              {saveError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || provincesLoading || citiesLoading || barangaysLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save location'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function LocationValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">{label}</p>
      <p className="mt-1.5 text-sm font-semibold break-words text-text-primary">{value}</p>
    </div>
  )
}

type SelectFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: PhLocationOption[]
  placeholder: string
  loading: boolean
  disabled: boolean
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  loading,
  disabled,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-text-secondary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
        className={SELECT_CLASSES}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}
