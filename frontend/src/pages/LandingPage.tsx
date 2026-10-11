import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useAuthDialog } from '../lib/auth-dialog'

export default function LandingPage() {
  const { openAuth } = useAuthDialog()
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animation = gsap.context(() => {
      const entrance = gsap.timeline({
        defaults: { duration: 0.65, ease: 'power3.out' },
      })

      entrance
        .fromTo(
          '[data-landing-hero] > *',
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, stagger: 0.1 },
        )
        .fromTo(
          '[data-landing-feature]',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12 },
          '-=0.25',
        )
    }, page)

    return () => animation.revert()
  }, [])

  return (
    <div ref={pageRef} className="py-6 sm:py-8">
      <section data-landing-hero className="mx-auto max-w-3xl text-center">
        <span className="rounded-full bg-primary-soft px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
          Flagship Karaoke Studio
        </span>
        <h1 className="mt-6 text-5xl leading-none font-bold tracking-wide uppercase sm:text-6xl">
          Sing your heart out
          <br />
          with BTP Karaoke
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-text-secondary">
          Browse master vault collections, queue your favorite tracks and sing along with lossless minus-one
          backing tracks — all in one studio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => openAuth('signup')}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-text-primary transition hover:bg-primary-hover"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => openAuth('signin')}
            className="rounded-lg border border-border bg-surface px-6 py-3 font-medium text-text-secondary transition hover:text-text-primary"
          >
            Sign In
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3">
        {[
          { title: 'Master Vault', desc: 'Lossless minus-one collections remastered from the BTP analogue archive.' },
          { title: 'Live Queue', desc: 'Request tracks, order the rotation and keep the stage moving.' },
          { title: 'Voice Tools', desc: 'Tune, edit and preview your vocals before the real take.' },
        ].map((feature) => (
          <article
            key={feature.title}
            data-landing-feature
            className="rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="text-xl font-semibold uppercase">{feature.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">{feature.desc}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
