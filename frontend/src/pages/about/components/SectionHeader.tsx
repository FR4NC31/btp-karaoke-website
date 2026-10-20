import SectionEyebrow from '../../../components/SectionEyebrow'

type SectionHeaderProps = {
  eyebrow: string
  title: string
  desc?: string
  meta?: string
}

export default function SectionHeader({ eyebrow, title, desc, meta }: SectionHeaderProps) {
  return (
    <div data-about-reveal className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-wide uppercase sm:text-4xl">{title}</h2>
      </div>
      {desc && <p className="max-w-md text-sm leading-relaxed text-text-muted">{desc}</p>}
      {meta && <p className="text-xs tracking-widest text-text-muted uppercase">{meta}</p>}
    </div>
  )
}
