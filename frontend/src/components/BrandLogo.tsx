import logo from '../assets/icons/btp_production_icon.png'

export default function BrandLogo({ className = 'size-9' }: { className?: string }) {
  return <img src={logo} alt="" className={className} />
}
