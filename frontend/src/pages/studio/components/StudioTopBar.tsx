import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  ChevronDownIcon,
  HeadphonesIcon,
  Mic01Icon,
  BellIcon,
} from '@hugeicons/core-free-icons'
import BrandLogo from '../../../components/BrandLogo'
import ProfileMenu from './ProfileMenu'

export default function StudioTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:gap-4 sm:px-4">
      <div className="flex shrink-0 items-center gap-3">
        <BrandLogo className="size-9 shrink-0 rounded-md" />
        <div className="hidden leading-tight sm:block">
          <div className="flex items-center gap-2">
            <p className="font-heading text-lg font-bold tracking-wide">BTP MUSIC PRODUCTION</p>
            <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-text-primary uppercase">
              FILSCAP Archive
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Sonic Music Engine v4.2 · 320kbps FLAC
          </p>
        </div>
      </div>

      <button
        type="button"
        className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary lg:flex"
      >
        All Vaults
        <HugeiconsIcon icon={ChevronDownIcon} size={14} />
      </button>

      <div className="relative mx-auto w-full min-w-0 max-w-md">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          placeholder="Search master recordings, multitracks, stems..."
          className="w-full rounded-lg border border-border bg-background py-2 pr-12 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary xl:flex">
          <HugeiconsIcon icon={HeadphonesIcon} size={15} />
          Listening Room
        </span>
        <span className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary xl:flex">
          <HugeiconsIcon icon={Mic01Icon} size={15} />
          Karaoke Rehearsal
        </span>
        <button
          type="button"
          aria-label="Notifications"
          className="grid size-8 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
        >
          <HugeiconsIcon icon={BellIcon} size={17} />
        </button>
        <ProfileMenu />
      </div>
    </header>
  )
}
