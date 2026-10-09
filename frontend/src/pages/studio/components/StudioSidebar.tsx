import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MusicNote03Icon, PlusIcon, DotIcon } from '@hugeicons/core-free-icons'
import { sidebarSections, studioTools } from '../data'

export default function StudioSidebar() {
  const [activeSidebar, setActiveSidebar] = useState('Master Collections Vault')

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded bg-primary text-text-primary">
            <HugeiconsIcon icon={MusicNote03Icon} size={14} />
          </span>
          <h2 className="font-heading text-base font-semibold tracking-wide uppercase">Catalog Stacks</h2>
        </div>
        <span className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-text-muted uppercase">
          1,842 Masters
        </span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sidebarSections.map((section) => (
          <div key={section.label}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">{section.label}</p>
              <button type="button" aria-label={`Add to ${section.label}`} className="text-text-muted transition hover:text-text-primary">
                <HugeiconsIcon icon={PlusIcon} size={12} />
              </button>
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = activeSidebar === item.name
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => setActiveSidebar(item.name)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                        active
                          ? 'bg-primary-soft text-primary'
                          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                      }`}
                    >
                      <HugeiconsIcon icon={DotIcon} size={12} className={active ? 'text-primary' : 'text-text-muted'} />
                      <span className="truncate">{item.name}</span>
                      {item.count && (
                        <span className="ml-auto shrink-0 text-[10px] text-text-muted">{item.count}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <div>
          <p className="mb-2 px-1 text-[10px] font-bold tracking-widest text-primary uppercase">Quick Studio Serbis</p>
          <div className="grid grid-cols-2 gap-2">
            {studioTools.map((tool) => (
              <button
                key={tool.code}
                type="button"
                className="rounded-lg border border-border bg-surface-elevated p-2 text-left transition hover:border-primary/50"
              >
                <p className="text-[9px] font-bold tracking-wider text-primary uppercase">{tool.code}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-text-primary">{tool.name}</p>
                <p className="truncate text-[10px] text-text-muted">{tool.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
        <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Master Audio Feed</p>
        <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
          Bit-Perfect
        </span>
      </div>
    </aside>
  )
}
