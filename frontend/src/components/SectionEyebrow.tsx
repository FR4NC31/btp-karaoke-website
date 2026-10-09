/** Red square + uppercase red label — the section eyebrow shared by page heroes. */
export default function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
      <span aria-hidden="true" className="size-1.5 shrink-0 bg-primary" />
      {children}
    </p>
  )
}
