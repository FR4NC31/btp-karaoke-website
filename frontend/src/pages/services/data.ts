import type { IconSvgElement } from '@hugeicons/react'
import {
  BookOpen01Icon,
  Mic01Icon,
  Radio01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'

export const rateCards = [
  { label: 'Standard Rate Base', value: '24–97K PHP', desc: 'Industry mastering specs' },
  { label: 'Production Turnaround', value: '3 – 5 Working Days', desc: 'Varies per scope' },
  { label: 'Copyright Handling', value: 'Direct FILSCAP', desc: 'Official songwriter portal' },
  { label: 'Live Broadcasting', value: 'Dedicated Slots', desc: 'Online global streaming' },
]

export type ServiceCard = {
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
    eyebrow: 'Production Services',
    desc: 'Studio recording, musical arranging, and post-production editing & mastering in a treated studio environment.',
    cols: 'lg:grid-cols-3',
    cards: [
      {
        tag: '01 / Tracking',
        badge: 'In-Studio',
        title: 'Music Studio Recording (Vocal and Instrumental)',
        desc: 'Professional recording sessions for vocals and instruments in a treated studio environment. Includes engineer assistance, microphone selection, and signal chain configuration. Available for solo artists, bands, and session musicians.',
        bullets: [
          'Acoustically-treated ISO booths',
          'Multi-mic setup & preamp rack',
          'Raw stems (24-bit/96kHz WAV) included',
          'Resident sound engineer on board',
        ],
      },
      {
        tag: '02 / Composition',
        badge: 'Creative Desk',
        title: 'Musical Arranging',
        desc: 'Custom arrangement services for your original compositions. Includes instrumentation planning, chord voicing, melodic counterpoint, and rhythm section mapping. Suitable for artists who have a song but need it fully realized.',
        bullets: [
          'Full acoustic & band instrumentation',
          'Lead sheets and chord charts',
          'Custom harmony & rhythm section beds',
          'Direct collaboration with BTP arrangers',
        ],
      },
      {
        tag: '03 / Mastering',
        badge: 'Post-Production',
        title: 'Music Cutting and Mastering',
        desc: 'Post-production services including vocal tuning, timing correction, noise reduction, mixing, and final mastering for distribution. Masters prepared for Spotify, Apple Music, YouTube, and other platforms.',
        bullets: [
          'Industry-standard LUFS targeting',
          'Vocal pitch/timing alignment',
          'Downloadable stems & session files',
          'Masters (DSD/FLAC/WAV) deliverable',
        ],
      },
    ],
    footers: [
      { unit: 'Hourly/Half-Day Block', action: 'Inquire Booking' },
      { unit: 'Per Composition', action: 'Submit Song Draft' },
      { unit: 'Per Track/Stem Pack', action: 'Request Mastering' },
    ],
  },
  {
    id: 'promote',
    icon: Radio01Icon,
    name: 'Promote',
    eyebrow: 'Broadcast and Promotion Services',
    desc: 'Broadcast and online promotion services covering Studio Radio Online sessions and Karaoke Music Video creation.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '04 / Broadcast',
        badge: 'Live Airplay',
        title: 'Studio Radio Online (Hour/Slot)',
        desc: 'Access to our online radio station for a dedicated hour or time slot. Artists can perform live, premiere new songs, host listening sessions, or conduct interviews. Includes recording of the broadcast for social media use.',
        bullets: [
          'Live stream broadcast feed across BTP networks',
          'Dedicated host & broadcast engineer on-site',
          'Full multi-track audio & video archive provided',
          'Live listener chat & community engagement screen',
        ],
      },
      {
        tag: '05 / Videoke Stars',
        badge: 'Synchronization',
        title: 'Karaoke Music Video Making/Editing',
        desc: 'Production of karaoke music videos from your original tracks. Includes lyric synchronization, visual design, and video editing. Deliverable in formats suitable for YouTube, videoke machines, and social media.',
        bullets: [
          'Millisecond-accurate lyric wipe/page animation',
          'High-definition 4K & 1080p clean video rendering',
          'Minus-one stereo audio channel pairing',
          'Videoke hardware system-compliant file sets (MDK/MP4)',
        ],
      },
    ],
    footers: [
      { unit: 'Per 60-Minute Broadcast', action: 'Book Radio Slot' },
      { unit: 'Per Karaoke Title', action: 'Create Karaoke MV' },
    ],
  },
  {
    id: 'learn',
    icon: BookOpen01Icon,
    name: 'Learn',
    eyebrow: 'Educational Services',
    desc: 'Musicianship instruction and private coaching in keyboard and vocal performance.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '06 / Musicianship',
        badge: 'One-on-One Coaching',
        title: 'Keyboard and Vocal Tutorial',
        desc: 'One-on-one or group lessons in keyboard playing and vocal technique. Designed for beginners to intermediate artists who want to improve their musicianship and performance skills.',
        bullets: [
          'Breath control, pitch accuracy & vocal placement',
          'Practical OPM chord theory & arrangement',
          '1-on-1 or private studio coaching sessions',
          'Tailored curriculum for recording and gigging artists',
        ],
      },
    ],
    aside: {
      badge: 'Crafted for Practical Filipino Musicians',
      title: 'Pedagogical Philosophy',
      intro:
        'We focus on practical, gig-ready and studio-ready application. Rather than abstract academic drills, our students work on active performance, realophone technique, and song interpretation.',
      groups: [
        { label: 'Voice', text: 'Vocal cord compression, mix voice, resonance shift, and lyric diction.' },
        { label: 'Keyboard', text: 'Chord progressions (I–vi–IV–V), rhythmic arpeggios, and voicing.' },
      ],
      cta: 'Schedule Initial Assessment',
    },
    footers: [{ unit: 'Modular 4 or 8 Session Bundles', action: 'Enroll in Class' }],
  },
  {
    id: 'protect',
    icon: Shield01Icon,
    name: 'Protect',
    eyebrow: 'Rights and Registration Services',
    desc: 'Official guidance and hands-on assistance for FILSCAP portal database entry and membership facilitation.',
    cols: 'lg:grid-cols-2',
    cards: [
      {
        tag: '07 / Cataloguing',
        badge: 'Database Entry',
        title: 'Assisting Artists to Put Their Songs on the FILSCAP Portal Database',
        desc: "Guidance and hands-on assistance in registering original compositions with FILSCAP's online portal. Ensures your songs are documented and eligible for royalty collection.",
        bullets: [
          'Portal metadata entry, splits & credit verification',
          'Lyric sheet formatting & musical score documentation',
          'Mechanical & public performance classification',
          'Direct submission assistance & clearance tracking',
        ],
      },
      {
        tag: '08 / Membership',
        badge: 'Creator Advocacy',
        title: 'Assisting Artists to Become a Member of FILSCAP',
        desc: 'End-to-end support in the FILSCAP membership application process. Includes document preparation, submission guidance, and orientation on how royalties work.',
        bullets: [
          'Comprehensive requirements checklist & audit',
          'Complete application dossier compiling',
          'Orientation on Philippine copyright (RA 8293)',
          'Direct liaison with FILSCAP Membership Committee',
        ],
      },
    ],
    footers: [
      { unit: 'Per Single / Album Catalog', action: 'Register Works' },
      { unit: 'Full Liaison Assistance', action: 'Apply for Membership' },
    ],
  },
]

export const matrix = [
  {
    tier: 'Create: Studio Tracking',
    scope: 'Vocal & multi-mic tracking in treated ISO rooms',
    deliverable: 'Raw 24-bit/96kHz WAV Stems',
    turnaround: 'Immediate on-wrap',
    desk: 'Book Studio',
  },
  {
    tier: 'Create: Song Arranging',
    scope: 'Harmonic structure, rhythm beds, lead sheets',
    deliverable: 'Full Multitrack Arrangement + MIDI',
    turnaround: '5 - 10 Business Days',
    desk: 'Submit Draft',
  },
  {
    tier: 'Create: Editing & Master',
    scope: 'Pitch correction, stereo bus mastering, LUFS norm',
    deliverable: 'Streaming Masters (WAV/FLAC)',
    turnaround: '3 - 5 Business Days',
    desk: 'Request Master',
  },
  {
    tier: 'Promote: Radio Online',
    scope: '1-Hour live studio airplay slot, guest interview, live set',
    deliverable: 'Live Broadcast + Archival Video/Audio',
    turnaround: 'Scheduled Slot (60 min)',
    desk: 'Reserve Slot',
  },
  {
    tier: 'Promote: Karaoke MV',
    scope: 'Lyric synchronization, HD video encode, minus-one',
    deliverable: '4K MP4 + Videoke Machine Files',
    turnaround: '3 - 5 Business Days',
    desk: 'Inquire MV',
  },
  {
    tier: 'Learn: Vocals & Keys',
    scope: 'One-on-one coaching, vocal ergonomics, piano voicings',
    deliverable: 'Rehearsal Recordings & Sheet Music',
    turnaround: 'Weekly Modules',
    desk: 'Enroll Now',
  },
  {
    tier: 'Protect: FILSCAP Portal',
    scope: 'Song registration, metadata entry & verification',
    deliverable: 'Official FILSCAP Work Clearance',
    turnaround: '2 - 4 Business Days',
    desk: 'Register Song',
  },
  {
    tier: 'Protect: Membership',
    scope: 'FILSCAP membership dossier filing, compliance, advisory',
    deliverable: 'Member Certificate & Author Code',
    turnaround: 'Application cycle dependent',
    desk: 'Start Process',
  },
]

export const filters = [
  { id: 'all', label: 'All Services', hint: '(8)' },
  { id: 'create', label: 'Create', hint: '(Studio)' },
  { id: 'promote', label: 'Promote', hint: '(Broadcast)' },
  { id: 'learn', label: 'Learn', hint: '(Education)' },
  { id: 'protect', label: 'Protect', hint: '(Licensing)' },
] as const

export type FilterId = (typeof filters)[number]['id']
