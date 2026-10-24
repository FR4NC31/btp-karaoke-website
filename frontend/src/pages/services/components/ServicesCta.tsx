import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'

export default function ServicesCta() {
  return (
    <section
      data-services-reveal
      className="-mx-6 mt-16 border-y border-border bg-surface px-6 py-14"
    >
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <SectionEyebrow>Contact BTP Music Production</SectionEyebrow>
          <h2 className="mt-4 font-heading text-3xl leading-none font-bold tracking-wide uppercase sm:text-4xl">
            Contact us today.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
            For inquiries, bookings, reservations, and service appointments, reach the studio through
            our contact page. Tell us about your project and let us help bring your music to life.
          </p>
          <p className="mt-4 max-w-2xl text-xs font-semibold tracking-widest text-text-muted uppercase">
            Supporting artists, composers, songwriters, and the growth of Original Philippine Music.
          </p>
        </div>
        <div>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover"
          >
            Contact Us
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
