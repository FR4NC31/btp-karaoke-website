import type { IconSvgElement } from '@hugeicons/react'
import {
  Clock01Icon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import type { AdminBooking } from '../../../../lib/admin-api'
import type { BookingStatus } from '../../../../lib/booking-api'
import { formatDay } from '../../../../lib/booking-format'

export type ActivityTone = 'primary' | 'success' | 'warning' | 'error' | 'muted'

export type ActivityLogEntry = {
  id: string
  typeLabel: string
  typeTone: ActivityTone
  typeIcon: IconSvgElement
  title: string
  details: string
  user: string
  userMeta: string
  timestamp: string
  schedule: string
  status: string
  statusTone: ActivityTone
  booking: AdminBooking
}

type ActivityPresentation = {
  typeLabel: string
  tone: ActivityTone
  icon: IconSvgElement
}

function presentationFor(booking: AdminBooking): ActivityPresentation {
  const code = booking.serviceCode?.toUpperCase() || ''
  if (code.includes('VIDEO') || code.includes('MV') || code.includes('KARAOKE-MV')) {
    return {
      typeLabel: 'Upload Video',
      tone: 'primary',
      icon: MusicNote01Icon,
    }
  }
  if (code.includes('TRACKING')) {
    return {
      typeLabel: 'Recording Session',
      tone: 'primary',
      icon: MusicNote01Icon,
    }
  }
  if (code.includes('MASTERING') || code.includes('ARRANGING') || code.includes('AUDIO')) {
    return {
      typeLabel: 'Upload Audio',
      tone: 'primary',
      icon: MusicNote01Icon,
    }
  }
  return {
    typeLabel: 'Reservation',
    tone: 'warning',
    icon: Clock01Icon,
  }
}

const STATUS_BADGE: Record<BookingStatus, { label: string; tone: ActivityTone }> = {
  pending: { label: 'Pending review', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'primary' },
  rejected: { label: 'Rejected', tone: 'error' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

/** "4 mins ago", "2 hrs ago", "3 days ago" — the log's coarse clock. */
function relativeTime(iso: string, now: number): string {
  const stamp = Date.parse(iso)
  if (Number.isNaN(stamp)) return 'Just now'

  const minutes = Math.max(0, Math.round((now - stamp) / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function scheduleFor(booking: AdminBooking): string {
  const day = formatDay(booking.bookingDate)
  const time = booking.bookingTime ? ` · ${booking.bookingTime.slice(0, 5)}` : ''
  return `${day}${time}`
}

/**
 * Builds the dashboard feed from real reservations — newest first.
 *
 * There is no dedicated audit-log endpoint yet; `createdAt` plus the current
 * status is the activity the console actually knows about. Rows deep-link to
 * the reservations desk, where the booking can be inspected and acted on.
 */
export function activityEntriesFrom(
  bookings: AdminBooking[],
  limit = 6,
): ActivityLogEntry[] {
  const now = Date.now()

  return [...bookings]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
    .map((booking) => {
      const presentation = presentationFor(booking)
      const statusInfo = STATUS_BADGE[booking.status] || { label: booking.status, tone: 'muted' }
      const contact = [booking.customerEmail, booking.customerContact]
        .filter(Boolean)
        .join(' · ')
      const payment =
        booking.paymentMethod === 'gcash'
          ? 'GCash receipt on file'
          : booking.paymentMethod === 'filler'
            ? 'Cash on arrival'
            : 'No payment method'

      return {
        id: booking.id,
        typeLabel: presentation.typeLabel,
        typeTone: presentation.tone,
        typeIcon: presentation.icon,
        title: booking.serviceName,
        details:
          booking.notes?.trim() ||
          `${booking.serviceCode} · ${booking.serviceUnit} · ${payment}`,
        user: booking.customerName,
        userMeta: contact || 'No contact on file',
        timestamp: relativeTime(booking.createdAt, now),
        schedule: scheduleFor(booking),
        status: statusInfo.label,
        statusTone: statusInfo.tone,
        booking,
      }
    })
}
