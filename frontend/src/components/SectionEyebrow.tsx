export default function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
      <span aria-hidden="true" className="size-1.5 shrink-0 bg-primary" />
      {children}
    </p>
  )
}
