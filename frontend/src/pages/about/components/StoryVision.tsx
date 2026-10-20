import { storyColumns } from '../data'
import SectionHeader from './SectionHeader'

/** Two-column story / vision archive. */
export default function StoryVision() {
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="The Journey" title="Our Story & Vision" meta="BTP Production Archive" />
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {storyColumns.map((column) => (
          <div key={column.heading} data-about-reveal>
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
  )
}
