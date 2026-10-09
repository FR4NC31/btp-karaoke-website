import logo from '../assets/icons/btp_production_icon.png'

/**
 * BTP logo mark, used in the site header and footer.
 *
 * Decorative: every current usage sits inside a link that already carries an
 * aria-label (or next to a visible brand name), so the image itself stays
 * out of the accessibility tree.
 */
export default function BrandLogo({ className = 'size-9' }: { className?: string }) {
  return <img src={logo} alt="" className={className} />
}
