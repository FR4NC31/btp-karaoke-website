
interface SidebarItem {
  name: string
  count: string
}

interface SidebarSection {
  label: string
  items: SidebarItem[]
}

export const sidebarSections: SidebarSection[] = [
  {
    label: 'Production Archives',
    items: [
      { name: 'Master Collections Vault', count: '84' },
      { name: 'Minus-Ones (Clean Instrumental)', count: '112' },
      { name: 'Stem Multitracks (Vocals/Beds)', count: '268' },
      { name: 'FILSCAP Heritage OPM Series', count: '60.0' },
    ],
  },
  {
    label: 'Live Setlists & Sessions',
    items: [
      { name: 'Acoustic Lounge Live Set 2025', count: '54' },
      { name: 'Pinoy Rock Rehearsal (Drop D)', count: '72' },
      { name: 'Duet Sing-Along Gold Vault', count: '38' },
      { name: 'Late Night Studio Sessions', count: '38' },
    ],
  },
]

interface StudioTool {
  code: string
  name: string
  desc: string
}

export const studioTools: StudioTool[] = [
  { code: 'Vocal A', name: 'Vocal Tuner', desc: 'Pitch & Formant' },
  { code: 'Banjo B', name: 'Minus-I Split', desc: 'StemExtractor' },
]
