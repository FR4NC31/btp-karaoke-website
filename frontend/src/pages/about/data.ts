import type { IconSvgElement } from '@hugeicons/react'
import {
  SparklesIcon,
  CopyrightIcon,
  Mic01Icon,
  UserIcon,
  HeartIcon,
  ShieldCheckIcon,
  MusicNote01Icon,
  AudioLinesIcon,
} from '@hugeicons/core-free-icons'

export type AboutStat = {
  value: string
  label: string
  desc: string
}

export type AboutService = {
  icon: IconSvgElement
  title: string
  desc: string
  label: string
}

export type AboutCommitment = {
  icon: IconSvgElement
  title: string
  desc: string
}

export type AboutStoryColumn = {
  heading: string
  paragraphs: string[]
}

export const stats: AboutStat[] = [
  { value: 'FILSCAP', label: 'Accredited Publisher', desc: 'Official copyright & licensing representation' },
  { value: '10,000+', label: 'Mastered Minus-Ones', desc: 'High-fidelity stems & synced video tracks' },
  { value: '100%', label: 'Filipino & OPM Focus', desc: 'Preserving classic & modern heritage' },
  { value: 'Global', label: 'Worldwide Distribution', desc: 'Connecting overseas Filipino communities' },
]

export const services: AboutService[] = [
  {
    icon: SparklesIcon,
    title: 'Music Production & Master Recording',
    desc: 'End-to-end songwriting, arrangement, and mixing using premium analog gear and modern techniques for broadcast-ready tracks.',
    label: 'Studio Sessions',
  },
  {
    icon: CopyrightIcon,
    title: 'FILSCAP Publishing & Rights',
    desc: 'Authoritative copyright management, royalty collection, and performance licensing under official FILSCAP standards.',
    label: 'Rights Protection',
  },
  {
    icon: Mic01Icon,
    title: 'Karaoke & Minus-One Video',
    desc: 'Developing authentic OPM karaoke backing tracks and synchronized lyric videos for digital platforms and commercial venues.',
    label: 'BTP Karaoke Vids',
  },
  {
    icon: UserIcon,
    title: 'Artist & Composer Development',
    desc: 'Nurturing emerging songwriters, vocalists, and producers with mentorship, production resources, and distribution pathways.',
    label: 'Talent Incubation',
  },
]

export const commitments: AboutCommitment[] = [
  {
    icon: HeartIcon,
    title: 'Puso (Heart)',
    desc: 'Every production begins with heartfelt passion and sincerity. We put the Filipino spirit at the center of each note.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Integrity & Copyright',
    desc: "Strict adherence to FILSCAP statutory protections, transparent royalty administration, and ethical defense of original creators' rights.",
  },
  {
    icon: MusicNote01Icon,
    title: 'OPM Heritage',
    desc: 'Unwavering dedication to keeping Filipino songwriting traditions vibrant while accommodating the new wave of modern musical innovations.',
  },
  {
    icon: AudioLinesIcon,
    title: 'Audio Excellence',
    desc: 'Precision audio mixing, professional minus-ones, synchronized lyric typography, and mastered delivery for every performance.',
  },
]

export const storyColumns: AboutStoryColumn[] = [
  {
    heading: 'Born from passion for OPM',
    paragraphs: [
      'BTP Music Production originated from a simple yet profound observation: Filipino musical culture is recognized across the globe, yet the creators, composers, and songwriters behind these beloved songs often struggle for proper copyright compensation and studio-labour representation.',
      'We established BTP ("Bawat Tibok ng Puso") to bridge this gap. We set out to build an authentic ecosystem where original arrangements are honored, minus-ones are crafted with intentional artistry rather than tiny MIDI replicas, and artists retain dignity over their creative output.',
    ],
  },
  {
    heading: 'Publishing with integrity & global reach',
    paragraphs: [
      'Our accreditation with the Filipino Society of Composers, Authors and Publishers (FILSCAP) establishes BTP as a legally recognized publishing house. We guarantee transparent royalty collection, proper administration, and prompt rightful compensation for every performance and stream.',
      'Moving forward, our vision is clear: to be the standard-bearer for digital karaoke platforms and Filipino music publishing, ensuring that whenever a song is performed in a bar, lounge, or streamed across the globe, every beat of the heart resonates with clarity.',
    ],
  },
]
