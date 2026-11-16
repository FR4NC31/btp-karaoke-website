import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit01Icon } from '@hugeicons/core-free-icons'
import { authClient } from '../../../../lib/auth-client'
import { readableError, unexpectedError } from '../../../../lib/auth-errors'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'

const CROP_SIZE = 256

/**
 * Pencil badge on the profile avatar: pick → drag/zoom crop → circular 512px
 * save through better-auth. Extracted from the old AccountTab on redesign.
 */
export default function AvatarEditor({
  image,
  onSaved,
}: {
  image?: string | null
  onSaved?: () => void | Promise<void>
}) {
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  }, [cropSrc])

  useEffect(() => {
    if (!naturalSize.w || !naturalSize.h) return
    const minZoom = Math.max(0.1, CROP_SIZE / Math.min(naturalSize.w, naturalSize.h))
    const z = Math.max(zoom, minZoom)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (z !== zoom) setZoom(z)
    const maxX = Math.max(0, (naturalSize.w * z - CROP_SIZE) / 2)
    const maxY = Math.max(0, (naturalSize.h * z - CROP_SIZE) / 2)
    setOffset((current) => ({
      x: Math.max(-maxX, Math.min(maxX, current.x)),
      y: Math.max(-maxY, Math.min(maxY, current.y)),
    }))
  }, [zoom, naturalSize])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller.')
      return
    }
    setError('')
    const url = URL.createObjectURL(file)
    setCropSrc((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
    setNaturalSize({ w: 0, h: 0 })
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setCropOpen(true)
  }

  async function handleSaveCrop() {
    if (!cropSrc || !naturalSize.w || !naturalSize.h) {
      setError('Choose an image first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const image = new Image()
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Could not read the image.'))
        image.src = cropSrc
      })

      const minZoom = Math.max(0.1, CROP_SIZE / Math.min(naturalSize.w, naturalSize.h))
      const z = Math.max(zoom, minZoom)
      const sw = CROP_SIZE / z
      const sh = CROP_SIZE / z
      const sx = naturalSize.w / 2 - offset.x / z - sw / 2
      const sy = naturalSize.h / 2 - offset.y / z - sh / 2
      const clampedSx = Math.max(0, Math.min(naturalSize.w - sw, sx))
      const clampedSy = Math.max(0, Math.min(naturalSize.h - sh, sy))

      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not prepare the cropped image.')
      context.drawImage(image, clampedSx, clampedSy, sw, sh, 0, 0, 512, 512)
      context.globalCompositeOperation = 'destination-in'
      context.beginPath()
      context.arc(256, 256, 256, 0, Math.PI * 2)
      context.fill()
      const dataUrl = canvas.toDataURL('image/png')

      const { error: updateError } = await authClient.updateUser({ image: dataUrl })
      if (updateError) {
        setError(readableError(updateError))
        return
      }
      setCropOpen(false)
      setCropSrc((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return null
      })
      await onSaved?.()
    } catch (err) {
      setError(unexpectedError('profile image update', err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveAvatar() {
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await authClient.updateUser({ image: null })
      if (updateError) {
        setError(readableError(updateError))
        return
      }
      setCropOpen(false)
      await onSaved?.()
    } catch (err) {
      setError(unexpectedError('profile image removal', err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Change profile photo"
        onClick={() => fileInputRef.current?.click()}
        className="absolute right-0 bottom-1 grid size-8 place-items-center rounded-full border-[3px] border-surface bg-primary text-text-primary transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="border border-border bg-surface text-text-primary">
          <DialogHeader>
            <DialogTitle>Crop profile photo</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Drag to reposition and scroll to zoom. The result will be a circular image.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div
              ref={cropViewportRef}
              className="relative overflow-hidden rounded-full border border-border bg-background"
              style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
              onPointerDown={(event) => {
                setDragging(true)
                setDragStart({ x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y })
              }}
              onPointerMove={(event) => {
                if (!dragging) return
                const minZoom = Math.max(0.1, CROP_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1))
                const z = Math.max(zoom, minZoom)
                const maxX = Math.max(0, (naturalSize.w * z - CROP_SIZE) / 2)
                const maxY = Math.max(0, (naturalSize.h * z - CROP_SIZE) / 2)
                setOffset({
                  x: Math.max(-maxX, Math.min(maxX, dragStart.ox + (event.clientX - dragStart.x))),
                  y: Math.max(-maxY, Math.min(maxY, dragStart.oy + (event.clientY - dragStart.y))),
                })
              }}
              onPointerUp={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
              onWheel={(event) => {
                event.preventDefault()
                const minZoom = Math.max(0.1, CROP_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1))
                setZoom(Math.max(minZoom, Math.min(3, zoom - event.deltaY * 0.001)))
              }}
            >
              {cropSrc && (
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={(event) => {
                    const target = event.currentTarget
                    setNaturalSize({ w: target.naturalWidth, h: target.naturalHeight })
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: naturalSize.w || undefined,
                    height: naturalSize.h || undefined,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                    transformOrigin: 'center center',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/80" />
            </div>

            <div className="flex w-full items-center gap-3 px-2">
              <span className="text-xs font-semibold text-text-secondary">Zoom</span>
              <input
                type="range"
                min={Math.max(0.1, CROP_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1))}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-2 flex-1 accent-primary"
                aria-label="Zoom crop"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            {image ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={saving}
                className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-error disabled:opacity-60"
              >
                Remove photo
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCropOpen(false)
                  setCropSrc((previous) => {
                    if (previous) URL.revokeObjectURL(previous)
                    return null
                  })
                }}
                disabled={saving}
                className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={saving || !cropSrc || !naturalSize.w}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save photo'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
