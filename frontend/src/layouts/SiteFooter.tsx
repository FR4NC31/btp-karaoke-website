import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Facebook01Icon, Mail01Icon, PhoneIcon } from '@hugeicons/core-free-icons'
import BrandLogo from '../components/BrandLogo'
import { fetchContactDetails, type ContactDetails } from '../lib/booking-api'

const year = new Date().getFullYear()

const DEFAULTS: ContactDetails = {
  facebookUrl: 'https://www.facebook.com/profile.php?id=61560004453465',
  facebookLabel: 'BTP Music Production',
  email: 'btpproduction2024@gmail.com',
  phone: '0932 973 6975',
  phoneHref: 'tel:+639329736975',
  address: '',
}

export default function SiteFooter() {
  const [details, setDetails] = useState<ContactDetails>(DEFAULTS)

  useEffect(() => {
    let alive = true
    fetchContactDetails()
      .then((result) => {
        if (alive && result.details) setDetails({ ...DEFAULTS, ...result.details })
      })
      .catch(() => {
        /* keep defaults */
      })
    return () => {
      alive = false
    }
  }, [])

  const channels = [
    { icon: Facebook01Icon, label: 'Facebook', value: details.facebookLabel, href: details.facebookUrl, external: true },
    { icon: Mail01Icon, label: 'Email', value: details.email, href: `mailto:${details.email}`, external: false },
    { icon: PhoneIcon, label: 'Phone', value: details.phone, href: details.phoneHref, external: false },
  ]

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <BrandLogo className="size-9 shrink-0" />
            <div className="leading-tight">
              <p className="font-heading text-base font-bold tracking-wide uppercase">BTP Music Production</p>
              <p className="text-[9px] font-semibold tracking-widest text-text-muted uppercase">Bawat Tibok ng Puso</p>
            </div>
          </div>

          {/* Contact icons */}
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                aria-label={channel.label}
                className="grid size-9 place-items-center rounded-lg border border-border bg-background text-text-secondary transition hover:border-primary/50 hover:text-primary"
              >
                <HugeiconsIcon icon={channel.icon} size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} BTP Music Production, Inc. (Bawat Tibok ng Puso). All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span className="cursor-default">Terms of Use</span>
            <span className="cursor-default">Privacy Policy</span>
            <span className="cursor-default">FILSCAP Licensing</span>
          </div>
        </div>
      </div>
    </footer>
  )
}