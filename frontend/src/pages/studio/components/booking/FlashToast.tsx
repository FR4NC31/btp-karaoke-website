import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'

/** How long the toast stays fully shown before it slides away. */
const VISIBLE_MS = 2000

/** The exit animation's length — the toast is removed right after it. */
const EXIT_MS = 200

type FlashToastProps = {
  /** Success line (e.g. `Cancelled BTP-XXXXXX.`). Empty hides the toast. */
  message: string
  /** Called once the exit finishes, so the parent can clear its flash state. */
  onDismiss: () => void
}

/**
 * The booking desk's success feedback: a fixed bottom-right toast that
 * slides up when an action lands (cancel, reschedule, …), holds for two
 * seconds, then slides down and tells the parent to clear the flash.
 * Entry/exit use tw-animate-css (`animate-in`/`animate-out`); the parent
 * keys the toast by its message, so every flash starts a fresh cycle.
 * `role="status"` keeps it announced — the reschedule e2e pins the text.
 */
export default function FlashToast({ message, onDismiss }: FlashToastProps) {
  const [leaving, setLeaving] = useState(false)

  // The parent recreates this callback every render; hold it in a ref so
  // the cycle's timers are never restarted by a stray re-render.
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  })

  // Hold for 2 s, then slide down and report back so the flash can clear.
  // The timers live in callbacks (not the effect body), so a re-render
  // never restarts the cycle.
  useEffect(() => {
    if (!message) return
    const hideTimer = window.setTimeout(() => setLeaving(true), VISIBLE_MS)
    const doneTimer = window.setTimeout(() => dismissRef.current(), VISIBLE_MS + EXIT_MS)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(doneTimer)
    }
  }, [message])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed right-4 bottom-24 left-4 z-[80] mx-auto flex max-w-sm items-start gap-2.5 rounded-xl border border-success/40 bg-success/10 px-3.5 py-3 text-sm text-success shadow-2xl backdrop-blur sm:right-6 sm:left-auto sm:mx-0',
        leaving
          ? 'animate-out slide-out-to-bottom-6 fade-out duration-200'
          : 'animate-in slide-in-from-bottom-6 fade-in duration-200',
      )}
    >
      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
      {message}
    </div>
  )
}
