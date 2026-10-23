import type { IconSvgElement } from '@hugeicons/react'
import {
  BookOpen01Icon,
  Mic01Icon,
  Radio01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'

export const rateCards = [
  { label: 'Music & Vocal Recording', value: '₱500 / hr', desc: 'In-studio tracking session' },
  { label: 'Audio Editing & Mastering', value: '₱1,200 / hr', desc: 'Mix, tune, and final master' },
  { label: 'Musical Arranging', value: 'From ₱2,500 / song', desc: 'Custom arrangement' },
  { label: 'Karaoke Music Video', value: 'From ₱1,200 / song', desc: 'Lyric sync + HD video' },
]

type ServiceCard = {
  tag: string
  badge: string
  title: string
  desc: string
  bullets: string[]
}

export type Wing = {
  id: string
  icon: IconSvgElement
  name: string
  eyebrow: string
  desc: string
  cols: string
  cards: ServiceCard[]
  aside?: { badge: string; title: string; intro: string; groups: { label: string; text: string }[]; cta: string }
  footers: { unit: string; action: string }[]
}

export const wings: Wing[] = [
  {
    id: 'create',
    icon: Mic01Icon,
    name: 'Create',
    eyebrow: 'Music Production & Recording',
    desc: 'Music production and recording services for singers, composers, musicians, and independent artists.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '01 / Recording',
        badge: 'In-Studio',
        title: 'Music and Vocal Recording',
        desc: 'Professional vocal and instrument tracking in a treated studio environment.',
        bullets: ['₱500 per hour', 'Engineer assistance included', 'Raw stems (24-bit/96kHz WAV)'],
      },
      {
        tag: '02 / Editing & Mastering',
        badge: 'Post-Production',
        title: 'Audio Editing & Mastering',
        desc: 'Vocal tuning, timing correction, noise reduction, mixing, and final mastering for distribution.',
        bullets: ['₱1,200 per hour', 'Masters for Spotify, Apple Music, YouTube', 'Downloadable stems & session files'],
      },
      {
        tag: '03 / Arranging',
        badge: 'Creative Desk',
        title: 'Musical Arranging',
        desc: 'Custom instrumentation, chord voicing, melodic counterpoint, and rhythm section mapping for original compositions.',
        bullets: ['From ₱2,500 per song', 'Lead sheets & chord charts', 'Direct collaboration with BTP arrangers'],
      },
      {
        tag: '04 / Karaoke MV',
        badge: 'Synchronization',
        title: 'Karaoke Music Video Production',
        desc: 'Karaoke music videos using music materials provided by the client.',
        bullets: [
          'From ₱1,200 per song',
          'Client provides: vocal, minus-one, lyrics, credits',
          'Recording & arranging billed separately',
        ],
      },
    ],
    footers: [
      { unit: 'Per Hour / Per Song', action: 'Inquire Booking' },
    ],
  },
  {
    id: 'promote',
    icon: Radio01Icon,
    name: 'Promote',
    eyebrow: 'Online Studio & Subscription',
    desc: 'Online studio broadcasting and music subscription services for BTP artists and partners.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '05 / Online Studio',
        badge: 'Live Broadcast',
        title: 'BTP Online Studio Services',
        desc: 'Online broadcasting, music programs, artist interviews, and music presentations.',
        bullets: ['₱1,200 per hour', 'Online radio-style programs', 'Artist interviews & discussions'],
      },
      {
        tag: '06 / Subscription',
        badge: 'Streaming',
        title: 'BTP Music Online Subscription',
        desc: 'Online playback of BTP music, karaoke videos, and song lyrics with MP3 downloads.',
        bullets: ['₱30 / month', '₱230 / year', 'Up to 5 MP3 downloads/mo (monthly)'],
      },
    ],
    footers: [
      { unit: 'Per Hour / Per Plan', action: 'Book Studio' },
    ],
  },
  {
    id: 'learn',
    icon: BookOpen01Icon,
    name: 'Learn',
    eyebrow: 'Music Lessons & Artist Development',
    desc: 'Vocal coaching and keyboard tutorials to improve technique, musicianship, and performance confidence.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '07 / Vocal Coaching',
        badge: 'One-on-One',
        title: 'Vocal Coaching',
        desc: 'Private vocal technique, breath control, pitch accuracy, and performance coaching.',
        bullets: ['₱500 per hour', 'Subject to availability', 'Gig-ready & studio-ready focus'],
      },
      {
        tag: '08 / Keyboard Tutorials',
        badge: 'One-on-One',
        title: 'Keyboard Tutorials',
        desc: 'Keyboard lessons covering OPM chord theory, rhythmic arpeggios, and voicing.',
        bullets: ['₱500 per hour', 'Beginner to intermediate', 'Practical song application'],
      },
    ],
    footers: [{ unit: 'Per Hour', action: 'Enroll Now' }],
  },
  {
    id: 'protect',
    icon: Shield01Icon,
    name: 'Protect',
    eyebrow: 'FILSCAP & VIP Membership',
    desc: 'FILSCAP membership and musical works assistance, plus VIP membership savings.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '09 / FILSCAP',
        badge: 'Rights & Registration',
        title: 'FILSCAP Membership & Works Assistance',
        desc: 'Guidance on FILSCAP membership applications and musical work declaration preparation.',
        bullets: [
          'From ₱2,500',
          'Document & portal submission support',
          'FILSCAP approval is independent',
        ],
      },
      {
        tag: '10 / VIP Card',
        badge: 'Membership',
        title: 'BTP VIP Membership Card',
        desc: '₱500 per year — 20% OFF all eligible BTP Music Production services.',
        bullets: ['Valid 1 year from activation', 'Non-transferable', '20% discount on service fees'],
      },
    ],
    footers: [
      { unit: 'Per Application / Per Year', action: 'Apply Now' },
    ],
  },
]

export const matrix = [
  {
    tier: 'Create: Music & Vocal Recording',
    scope: 'Vocal & instrument tracking, ₱500/hr',
    deliverable: 'Raw 24-bit/96kHz WAV Stems',
    turnaround: 'Per session booking',
    desk: 'Inquire Booking',
  },
  {
    tier: 'Create: Audio Editing & Mastering',
    scope: 'Mix, tune, master, ₱1,200/hr',
    deliverable: 'Streaming Masters (WAV/FLAC)',
    turnaround: '3 - 5 Business Days',
    desk: 'Request Mastering',
  },
  {
    tier: 'Create: Musical Arranging',
    scope: 'Custom arrangement, from ₱2,500/song',
    deliverable: 'Full Arrangement + Lead Sheets',
    turnaround: '5 - 10 Business Days',
    desk: 'Submit Song Draft',
  },
  {
    tier: 'Create: Karaoke Music Video',
    scope: 'Lyric sync + HD video, from ₱1,200/song',
    deliverable: '4K MP4 + Videoke Files',
    turnaround: '3 - 5 Business Days',
    desk: 'Create Karaoke MV',
  },
  {
    tier: 'Promote: BTP Online Studio',
    scope: 'Online broadcast, ₱1,200/hr',
    deliverable: 'Live Broadcast + Archive',
    turnaround: 'Scheduled Slot (60 min)',
    desk: 'Book Studio',
  },
  {
    tier: 'Promote: Online Subscription',
    scope: 'Music & karaoke playback, ₱30/mo or ₱230/yr',
    deliverable: 'Streaming Access + MP3 Downloads',
    turnaround: 'Instant on subscription',
    desk: 'Subscribe',
  },
  {
    tier: 'Learn: Vocal Coaching',
    scope: 'One-on-one vocal technique, ₱500/hr',
    deliverable: 'Performance Readiness',
    turnaround: 'Per session',
    desk: 'Enroll Now',
  },
  {
    tier: 'Learn: Keyboard Tutorials',
    scope: 'Keyboard lessons, ₱500/hr',
    deliverable: 'Musicianship Skills',
    turnaround: 'Per session',
    desk: 'Enroll Now',
  },
  {
    tier: 'Protect: FILSCAP Works Assistance',
    scope: 'Song registration & portal entry, from ₱2,500',
    deliverable: 'FILSCAP Work Clearance',
    turnaround: '2 - 4 Business Days',
    desk: 'Register Works',
  },
  {
    tier: 'Protect: VIP Membership Card',
    scope: '₱500/year, 20% off eligible services',
    deliverable: 'VIP Card & Discount Benefits',
    turnaround: 'Valid 1 year',
    desk: 'Apply Now',
  },
]

export const filters = [
  { id: 'all', label: 'All Services', hint: `(${wings.reduce((n, w) => n + w.cards.length, 0)})` },
  { id: 'create', label: 'Create', hint: '(Production)' },
  { id: 'promote', label: 'Promote', hint: '(Studio + Streaming)' },
  { id: 'learn', label: 'Learn', hint: '(Lessons)' },
  { id: 'protect', label: 'Protect', hint: '(FILSCAP + VIP)' },
] as const

export type FilterId = (typeof filters)[number]['id']
