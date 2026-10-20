import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import SectionEyebrow from '../../../components/SectionEyebrow'

export default function ServicesCta() {
  return (
    <section data-services-reveal className="-mx-6 mt-16 border-y border-border bg-surface px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <SectionEyebrow>Start Your Production</SectionEyebrow>
          <h2 className="mt-4 font-heading text-3xl leading-none font-bold tracking-wide uppercase sm:text-4xl">
            Ready to bring your music to life?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Whether you need audio recording, complete arrangement, or guidance protecting your copyright with
            FILSCAP, our team at BTP Music Production is ready to help.
          </p>
        </div>
        <div>
          <p className="font-heading text-xl font-bold tracking-wide uppercase">Contact our production desk</p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-medium text-text-secondary transition hover:text-text-primary"
          >
            Contact the production desk
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
