/**
 * /services content — the single source for the public service sheet.
 *
 * Contact details deliberately live on /contact only; every service inquiry
 * cross-link points there instead of repeating the email or phone number.
 */

export type PricedService = {
  title: string
  price: string
  unit: string
}

export type ServiceGroupData = {
  id: string
  eyebrow: string
  title: string
  intro?: string
  cards: PricedService[]
  columns: string
  note?: string
}

export const serviceGroups: ServiceGroupData[] = [
  {
    id: 'production',
    eyebrow: 'Studio Services',
    title: 'Music Production & Recording',
    cards: [
      { title: 'Music and Vocal Recording', price: '₱500', unit: 'per hour' },
      { title: 'Music, Vocal Audio Editing and Mastering', price: '₱1,200', unit: 'per hour' },
      { title: 'Musical Arranging', price: 'Starting at ₱2,500', unit: 'per song' },
      { title: 'Karaoke Music Video Production', price: 'Starting at ₱1,000', unit: 'per video' },
    ],
    columns: 'sm:grid-cols-2',
  },
  {
    id: 'lessons',
    eyebrow: 'Artist Development',
    title: 'Music Lessons & Artist Development',
    intro:
      'Improve your vocal performance and musical skills with our coaching and tutorial services.',
    cards: [
      { title: 'Vocal Coaching', price: '₱500', unit: 'per hour' },
      { title: 'Keyboard Tutorials', price: '₱500', unit: 'per hour' },
    ],
    columns: 'sm:grid-cols-2',
  },
  {
    id: 'entertainment',
    eyebrow: 'Live & Session Talent',
    title: 'Vocalists, Artists & Entertainment',
    cards: [
      {
        title: 'Vocalist for Hire (Recording Sessions)',
        price: 'Starting at ₱3,000',
        unit: 'per song',
      },
      {
        title: 'Artist Booking, Guest Appearances & Concerts',
        price: 'Starting at ₱5,000',
        unit: 'per day',
      },
      { title: 'Sound System Rental', price: 'Starting at ₱2,500', unit: 'per event' },
    ],
    columns: 'sm:grid-cols-2 lg:grid-cols-3',
    note: 'Artist booking fees and sound system rental rates may vary depending on the event, location, duration, and technical requirements.',
  },
]

export const filscap = {
  eyebrow: 'Rights & Registration',
  title: 'FILSCAP Membership & Musical Works Assistance',
  intro:
    'BTP Music Production assists artists and composers who wish to apply for FILSCAP membership and register or submit their musical works through the appropriate FILSCAP procedures.',
  assistanceLabel: 'Our assistance may include',
  assistance: [
    'Guidance on FILSCAP membership applications',
    'Assistance with the preparation and submission of musical work declarations',
    'Assistance with the preparation of required documents',
    'Administrative support for musical work declarations and related paperwork',
    'Assistance with submitting music information for the FILSCAP Portal and database, subject to FILSCAP requirements and approval',
  ],
  feeLabel: 'Administrative Assistance Fee',
  fee: 'Starting at ₱2,500',
  disclaimer:
    'The artist or composer must provide or cover applicable transportation, printing, notarization, and other required out-of-pocket expenses, as agreed in advance. FILSCAP membership approval, work registration, and royalty payments are subject to FILSCAP’s rules and procedures. Our assistance does not guarantee approval or royalty earnings.',
} as const

export const subscription = {
  eyebrow: 'Streaming & Downloads',
  title: 'BTP Music Online Subscription',
  intro: 'Enjoy BTP Music through our online music subscription options.',
  plans: [
    { label: 'Monthly Subscription', price: '₱20', unit: 'per month' },
    { label: 'Annual Subscription', price: '₱180', unit: 'per year' },
  ],
  benefitsLabel: 'Subscription benefits may include',
  benefits: [
    'Online playback of BTP Music',
    'Access to available BTP music videos and karaoke videos',
    'Access to available MP3 music files and song lyrics',
    'Enjoying music from BTP Music Production artists and partners',
  ],
  disclaimer:
    'Playback, downloads, and file access are subject to the applicable subscription terms, platform availability, and permissions for each musical work.',
} as const

export const vip = {
  eyebrow: 'Membership',
  title: 'BTP Music Production VIP Membership Card',
  headline: '20% OFF',
  headlineSuffix: 'eligible BTP Music Production services',
  intro:
    'Become a BTP Music Production VIP Member and enjoy a special discount on eligible services, including:',
  eligible: [
    'Music and vocal recording',
    'Music and audio editing',
    'Audio mastering',
    'Musical arranging',
    'Vocal coaching and keyboard tutorials',
    'Karaoke music video production',
    'Other eligible BTP Music Production services',
  ],
  benefitLabel: 'VIP Member Benefit',
  benefit: '20% discount on eligible services.',
  terms:
    'VIP membership terms and conditions apply. Discounts cannot be combined with other promotions unless authorized by BTP Music Production. Third-party fees, transportation, notarization, printing, and other reimbursable expenses are excluded unless otherwise stated.',
} as const
