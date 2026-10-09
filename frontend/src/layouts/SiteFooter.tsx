import BrandLogo from '../components/BrandLogo'

const columns = [
  {
    heading: 'Accreditation',
    items: [
      { label: 'FILSCAP-Accredited Music Publisher', accent: false },
      { label: 'Music Rights & Mechanical Licensing', accent: true },
      { label: 'BTP Karaoke Online Platform', accent: true },
    ],
  },
  {
    heading: 'Navigation',
    items: [
      { label: 'Home', accent: false },
      { label: 'Song Catalog', accent: false },
      { label: 'Rooms', accent: false },
      { label: 'Bookings', accent: false },
      { label: 'About Us', accent: false },
    ],
  },
  {
    heading: 'Services',
    items: [
      { label: 'Original OPM Production', accent: false },
      { label: 'Karaoke Stems & Minus-Ones', accent: false },
      { label: 'Compositor Rights Administration', accent: false },
      { label: 'Digital Karaoke Distribution', accent: false },
    ],
  },
]

/**
 * Site-wide footer (Home, About, … — everything under RootLayout).
 * /studio has its own player footer and does not use this component.
 *
 * All entries are visual only for now: destinations for catalog / rooms /
 * bookings do not exist yet, so they render as styled spans instead of dead
 * links.
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo className="size-10" />
              <p className="font-heading text-lg font-bold tracking-wide uppercase">BTP Music Production</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-muted">
              Bawat Tibok ng Puso — Every Beat of the Heart. Dedicated to creating, publishing, and promoting
              Filipino music and OPM worldwide.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <p className="text-xs font-bold tracking-widest text-text-primary uppercase">{column.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {column.items.map((item) => (
                  <li
                    key={item.label}
                    className={`text-sm ${item.accent ? 'text-primary' : 'text-text-secondary'}`}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2025 BTP Music Production, Inc. (Bawat Tibok ng Puso). All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Terms of Use</span>
            <span>Privacy Policy</span>
            <span>FILSCAP Licensing</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
