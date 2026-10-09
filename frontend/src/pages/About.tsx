import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
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
import BrandLogo from '../components/BrandLogo'
import SectionEyebrow from '../components/SectionEyebrow'

const stats = [
  { value: 'FILSCAP', label: 'Accredited Publisher', desc: 'Official copyright & licensing representation' },
  { value: '10,000+', label: 'Mastered Minus-Ones', desc: 'High-fidelity stems & synced video tracks' },
  { value: '100%', label: 'Filipino & OPM Focus', desc: 'Preserving classic & modern heritage' },
  { value: 'Global', label: 'Worldwide Distribution', desc: 'Connecting overseas Filipino communities' },
]

const services: { icon: IconSvgElement; title: string; desc: string; label: string }[] = [
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

const commitments: { icon: IconSvgElement; title: string; desc: string }[] = [
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

const storyColumns = [
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

function SectionHeader({ eyebrow, title, desc, meta }: { eyebrow: string; title: string; desc?: string; meta?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">{title}</h2>
      </div>
      {desc && <p className="max-w-md text-sm leading-relaxed text-text-muted">{desc}</p>}
      {meta && <p className="text-xs tracking-widest text-text-muted uppercase">{meta}</p>}
    </div>
  )
}

export default function About() {
  return (
    <div className="py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-widest uppercase">
        <Link to="/" className="text-primary hover:text-primary-hover">
          Home
        </Link>
        <span className="text-text-muted"> / About Us</span>
      </nav>

      {/* Hero */}
      <section className="mt-8">
        <SectionEyebrow>FILSCAP-Accredited Publisher &amp; Production House</SectionEyebrow>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="font-heading text-4xl leading-none font-bold tracking-wide uppercase sm:text-5xl">
              Bawat Tibok ng Puso — Every Beat of the Heart
            </h1>
            <p className="mt-6 leading-relaxed text-text-secondary">
              BTP stands for <strong className="font-semibold text-text-primary">"Bawat Tibok ng Puso"</strong>,{' '}
              translated to <em className="font-semibold text-primary">"Every Beat of the Heart"</em>. We believe
              every song originates from authentic human emotion, carrying a story, an artistic legacy, and a
              rhythm that connects Filipinos everywhere.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Based in the Philippines, BTP Music Production is dedicated to creating, producing, mastering,
              publishing, and championing Original Pilipino Music (OPM). Through our certified status with FILSCAP
              and state-of-the-art karaoke engineering, we empower homegrown songwriters while delivering
              studio-grade minus-one tracks for audiences worldwide.
            </p>
          </div>

          <aside className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <BrandLogo className="size-14 shrink-0" />
              <div>
                <p className="font-heading text-lg leading-tight font-bold tracking-wide uppercase">
                  BTP Music Production
                </p>
                <p className="mt-0.5 text-xs font-bold tracking-widest text-primary uppercase">
                  Bawat Tibok ng Puso
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-success">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
              FILSCAP Accredited
            </p>
            <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-text-secondary italic">
              "Every melody begins with the heart. We protect composer rights, preserve Filipino musical culture,
              and build the world's most authentic karaoke catalog."
            </p>
            <p className="mt-3 text-xs font-bold tracking-widest text-text-primary uppercase">
              — BTP Music Production Directorate
            </p>
          </aside>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mt-14 border-y border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.value}
              className={`px-5 py-8 sm:px-6 ${i >= 2 ? 'border-t border-border' : ''} ${
                i % 2 === 1 ? 'border-l border-border' : ''
              } lg:border-t-0 ${i > 0 ? 'lg:border-l lg:border-border' : ''}`}
            >
              <p className="font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-xs font-bold tracking-widest text-primary uppercase">{stat.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we do */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Capabilities & Services"
          title="What We Do"
          desc="Full-spectrum audio engineering, rights management, and digital karaoke solutions tailored for the Philippine music landscape."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article key={service.title} className="flex flex-col rounded-xl border border-border bg-surface p-6">
              <span aria-hidden="true">
                <HugeiconsIcon icon={service.icon} size={22} className="text-text-primary" />
              </span>
              <h3 className="mt-4 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
                {service.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{service.desc}</p>
              <p className="mt-4 text-xs font-bold tracking-widest text-primary uppercase">{service.label}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Story & vision */}
      <section className="mt-16">
        <SectionHeader eyebrow="The Journey" title="Our Story & Vision" meta="BTP Production Archive" />
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {storyColumns.map((column) => (
            <div key={column.heading}>
              <h3 className="font-heading text-lg font-bold tracking-wide uppercase">{column.heading}</h3>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-text-secondary">
                {column.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core commitments */}
      <section className="mt-16">
        <SectionHeader eyebrow="Guiding Principles" title="Our Core Commitments" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.map((item) => (
            <article key={item.title} className="rounded-xl border border-border bg-surface p-6">
              <span aria-hidden="true">
                <HugeiconsIcon icon={item.icon} size={20} className="text-primary" />
              </span>
              <h3 className="mt-4 font-heading text-base font-bold tracking-wide uppercase">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="-mx-6 mt-16 border-y border-border bg-surface px-6 py-14 text-center">
        <div className="flex justify-center">
          <SectionEyebrow>Collaborate &amp; Connect</SectionEyebrow>
        </div>
        <h2 className="mx-auto mt-4 max-w-2xl font-heading text-4xl leading-none font-bold tracking-wide uppercase sm:text-5xl">
          Partner with BTP Music Production
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Whether you are a songwriter registering new works, an artist seeking studio mastering, or a venue
          looking for licensed karaoke systems, our team is ready to assist.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <span className="rounded-lg bg-primary px-6 py-3 font-medium text-text-primary">
            Contact Our Production Team
          </span>
          <span className="rounded-lg border border-border bg-background px-6 py-3 font-medium text-text-secondary">
            Explore Song Catalog
          </span>
        </div>
      </section>
    </div>
  )
}
