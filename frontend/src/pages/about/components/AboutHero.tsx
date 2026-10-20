import BrandLogo from '../../../components/BrandLogo'
import SectionEyebrow from '../../../components/SectionEyebrow'

export default function AboutHero() {
  return (
    <section data-about-hero className="mt-8">
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
  )
}
