import { Link } from 'react-router'
import SectionEyebrow from '../../../components/SectionEyebrow'

/** Full-bleed-ish closing CTA band (inset inside the page wrapper). */
export default function AboutCta() {
  return (
    <section data-about-reveal className="-mx-6 mt-16 border-y border-border bg-surface px-6 py-14 text-center">
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
        <Link
          to="/contact"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-text-primary transition hover:bg-primary-hover"
        >
          Contact Our Production Team
        </Link>
        <Link
          to="/services"
          className="rounded-lg border border-border bg-background px-6 py-3 font-medium text-text-secondary transition hover:text-text-primary"
        >
          Explore Our Services
        </Link>
      </div>
    </section>
  )
}
