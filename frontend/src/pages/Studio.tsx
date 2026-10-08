import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  MusicNote01Icon,
  MusicNote02Icon,
  MusicNote03Icon,
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  SkipBackIcon,
  ShuffleIcon,
  RepeatIcon,
  HeartIcon,
  Clock01Icon,
  HashtagIcon,
  PlayListIcon,
  MoreHorizontalIcon,
  ArrowRight01Icon,
  UserIcon,
  Settings01Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons'
import Placeholder from '../components/Placeholder'

const sidebarSections = [
  {
    label: 'Production Sessions',
    items: [
      { name: 'Master Collections Vault', count: '31' },
      { name: 'Vinyl Masters (Clean Instrumental)', count: '512' },
      { name: 'Demo Masters Vol.1 (Acoustic)', count: '51' },
      { name: 'Recording Studio Vault', count: '28' },
    ],
  },
  {
    label: 'Daily Mix & Masters',
    items: [
      { name: 'Accoustic Lounge Set Live 2025', count: '14' },
      { name: 'Pivot Drill Selection Drop 20', count: '07' },
      { name: 'Love Song Along Drafts', count: '06' },
    ],
  },
  {
    label: 'Voice Tools',
    items: [
      { name: 'Voice Tuner', count: '' },
      { name: 'Audio Edit', count: '' },
    ],
  },
]

const filterGenre = [
  'All Genres',
  'Pop',
  'Rock',
  'R&B',
  'Hip-Hop',
  'Ballad',
  'Acoustic',
]

const collections = [
  { title: 'Afternoon Drive', desc: 'Mastered by Frankie Dev', bpm: '118 BPM', key: 'Fmaj', tag: 'Mix' },
  { title: 'Strict Minus-One Kit', desc: 'BTP Production Originals', bpm: '124 BPM', key: 'Amin', tag: 'Vault' },
  { title: 'Pivot Rhythm Anthems Vol.', desc: 'Glass Avenue FH Archive', bpm: '132 BPM', key: 'Gmaj', tag: 'Live' },
  { title: 'Opn Classics & Golden Eras', desc: 'BTP Production Master Tape', bpm: '96 BPM', key: 'Cmaj', tag: 'Tape' },
  { title: 'Soft Acoustic & Chill', desc: 'Acoustic Room Sessions', bpm: '72 BPM', key: 'Dmin', tag: 'Mix' },
]

const telemetry = [
  { no: '01', title: 'Die With A Smile (Cover)', artist: 'Lady Gaga & Bruno Mars', fmt: 'WAV 24-bit', date: '2025-08-12', key: 'C Maj', tempo: '104 BPM', len: '4:11' },
  { no: '02', title: 'Afternoon Drive', artist: 'Frankie Dev', fmt: 'FLAC 16-bit', date: '2025-08-10', key: 'F Maj', tempo: '118 BPM', len: '3:44' },
  { no: '03', title: 'Pivot Drill Selection', artist: 'Glass Avenue FH', fmt: 'WAV 24-bit', date: '2025-08-09', key: 'G Min', tempo: '132 BPM', len: '2:58' },
  { no: '04', title: 'Strict Minus-One Kit', artist: 'BTP Production', fmt: 'FLAC 16-bit', date: '2025-08-05', key: 'A Min', tempo: '124 BPM', len: '5:02' },
  { no: '05', title: 'Acoustic Lounge Live', artist: 'BTP Sessions', fmt: 'WAV 24-bit', date: '2025-08-01', key: 'D Maj', tempo: '88 BPM', len: '6:21' },
]

export default function Studio() {
  const [activeSidebar, setActiveSidebar] = useState('Master Collections Vault')
  const [activeTab, setActiveTab] = useState('All Genres')
  const [playing, setPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-dvh flex-col bg-background text-text-primary">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
        <div className="flex shrink-0 items-center gap-3">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-text-primary">
            <HugeiconsIcon icon={MusicNote01Icon} size={18} />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-lg font-bold tracking-wide">BTP MUSIC PRODUCTION</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Flagship Studio</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            placeholder="Search sessions, tracks, stems, artists..."
            className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-text-primary">Mix</span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">All Instruments</span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">Vocals</span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="hidden rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary xl:block">
            Unfinished Demo
          </span>
          <span className="hidden rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary xl:block">
            Kurante Rotational
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className={`block rounded-full transition ring-offset-2 ring-offset-surface focus:outline-none ${
                profileOpen ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-border'
              }`}
            >
              <Placeholder icon={UserIcon} iconSize={16} className="size-9 rounded-full" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface-elevated py-1 shadow-xl shadow-black/40">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold">Mc BTP</p>
                    <p className="text-[11px] text-text-muted">admin@btp.com</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-surface hover:text-text-primary"
                  >
                    <HugeiconsIcon icon={UserIcon} size={16} />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-surface hover:text-text-primary"
                  >
                    <HugeiconsIcon icon={Settings01Icon} size={16} />
                    Settings
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/signin')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition hover:bg-primary-soft hover:text-error"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={16} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="grid size-6 place-items-center rounded bg-primary text-text-primary">
              <HugeiconsIcon icon={MusicNote03Icon} size={14} />
            </span>
            <h2 className="font-heading text-base font-semibold tracking-wide uppercase">Mixing Studio</h2>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {sidebarSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                  {section.label}
                </p>
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
                          <span className={`size-1.5 shrink-0 rounded-full ${active ? 'bg-primary' : 'bg-text-muted'}`} />
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
          </nav>

          <div className="border-t border-border p-3">
            <p className="mb-2 text-[10px] font-bold tracking-widest text-text-muted uppercase">Master Juke Box</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated p-2">
              <Placeholder icon={MusicNote01Icon} iconSize={14} className="size-9 shrink-0 rounded-md" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-semibold">Die With A Smile</p>
                <p className="truncate text-[10px] text-text-muted">Next request</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 space-y-8 overflow-y-auto p-6">
          {/* Featured collection */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex gap-6">
              <Placeholder icon={MusicNote01Icon} iconSize={40} className="hidden size-40 shrink-0 rounded-lg sm:block" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                    Master Vault Collection
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    Playing Lossless
                  </span>
                </div>

                <h1 className="mt-3 font-heading text-4xl leading-none font-bold tracking-wide uppercase lg:text-5xl">
                  Oph Gold &amp; Contemporary
                  <br />
                  Minus-One Suite
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  Digitally remastered direct from the BTP analogue archives. Includes pristine transfer vinyl rips,
                  cabinet mic sessions and authentic handheld contemporary backing tracks, preserving all the warmth of
                  our original barbershop production playlists.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={MusicNote02Icon} size={14} />
                    52 Tracks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={HashtagIcon} size={14} />
                    24 Lossless Stems
                  </span>
                  <span>NO-06 FLAC</span>
                </div>

                <p className="mt-3 text-[11px] tracking-widest text-text-muted uppercase">BTP Studio Vault</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover"
                  >
                    <HugeiconsIcon icon={PlayIcon} size={16} />
                    Play Master Collection
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
                  >
                    <HugeiconsIcon icon={PlayListIcon} size={16} />
                    Queue Studio Rotation
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary transition hover:border-primary"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    Legacy Mauve Harmony
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Filter by genre */}
          <section className="flex flex-wrap items-center gap-2">
            {filterGenre.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setActiveTab(genre)}
                className={`rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase transition ${
                  activeTab === genre
                    ? 'bg-primary text-text-primary'
                    : 'border border-border bg-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                {genre}
              </button>
            ))}
            <span className="ml-auto hidden text-xs text-text-muted sm:block">Catalogue Sequence (STD-01)</span>
          </section>

          {/* Master vault collections */}
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-primary">◆</span>
              <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Master Vault Collections</h2>
              <span className="text-[10px] tracking-widest text-text-muted uppercase">Active Stem Systems</span>
              <span className="ml-auto text-xs text-text-muted">Viewing 1 of 18 sets</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {collections.map((item) => (
                <article
                  key={item.title}
                  className="group overflow-hidden rounded-lg border border-border bg-surface transition hover:border-primary/50"
                >
                  <div className="relative">
                    <Placeholder icon={MusicNote01Icon} iconSize={28} className="aspect-[4/3] w-full" />
                    <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-text-primary uppercase">
                      {item.tag}
                    </span>
                    <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-primary text-text-primary opacity-0 transition group-hover:opacity-100">
                      <HugeiconsIcon icon={PlayIcon} size={14} />
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="truncate font-heading text-base font-semibold tracking-wide uppercase">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">{item.desc}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <HugeiconsIcon icon={Clock01Icon} size={12} />
                        {item.bpm}
                      </span>
                      <span className="flex items-center gap-1">
                        <HugeiconsIcon icon={HashtagIcon} size={12} />
                        {item.key}
                      </span>
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={12} className="text-text-muted" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Telemetry table */}
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-primary">◆</span>
              <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Active Stem &amp; Track Telemetry</h2>
              <span className="text-[10px] tracking-widest text-text-muted uppercase">API System Optimization</span>
              <span className="ml-auto text-xs text-primary">BTP Support List · Click Full To Track</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] tracking-widest text-text-muted uppercase">
                    <th className="px-4 py-3 font-semibold">No.</th>
                    <th className="px-4 py-3 font-semibold">Trk / Title &amp; Master Artist</th>
                    <th className="px-4 py-3 font-semibold">Format / Date</th>
                    <th className="px-4 py-3 font-semibold">Key</th>
                    <th className="px-4 py-3 font-semibold">Tempo</th>
                    <th className="px-4 py-3 font-semibold">Length</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.map((row) => (
                    <tr
                      key={row.no}
                      className="border-b border-border/50 transition last:border-0 hover:bg-surface-elevated"
                    >
                      <td className="px-4 py-3 text-text-muted">{row.no}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">{row.title}</p>
                        <p className="text-[11px] text-text-muted">{row.artist}</p>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {row.fmt}
                        <br />
                        <span className="text-[10px] text-text-muted">{row.date}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{row.key}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.tempo}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.len}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary hover:text-text-primary"
                        >
                          <HugeiconsIcon icon={PlayIcon} size={12} />
                          Play
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Player bar */}
      <footer className="grid h-20 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-6 border-t border-border bg-surface px-4">
        {/* Track info */}
        <div className="flex min-w-0 items-center gap-3">
          <Placeholder icon={MusicNote01Icon} iconSize={16} className="size-12 shrink-0 rounded-md" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">Die With A Smile (Cover)</p>
            <p className="truncate text-[11px] text-text-muted">Lady Gaga &amp; Bruno Mars</p>
          </div>
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            aria-label="Like"
            className={`ml-1 shrink-0 transition ${liked ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <HugeiconsIcon icon={HeartIcon} size={16} />
          </button>
        </div>

        {/* Controls + progress */}
        <div className="flex w-[min(36rem,40vw)] flex-col items-center gap-2">
          <div className="flex items-center gap-5">
            <button type="button" aria-label="Shuffle" className="text-text-muted transition hover:text-text-primary">
              <HugeiconsIcon icon={ShuffleIcon} size={16} />
            </button>
            <button type="button" aria-label="Previous" className="text-text-secondary transition hover:text-text-primary">
              <HugeiconsIcon icon={SkipBackIcon} size={18} />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? 'Pause' : 'Play'}
              className="grid size-9 place-items-center rounded-full bg-primary text-text-primary transition hover:bg-primary-hover"
            >
              <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
            </button>
            <button type="button" aria-label="Next" className="text-text-secondary transition hover:text-text-primary">
              <HugeiconsIcon icon={SkipForwardIcon} size={18} />
            </button>
            <button type="button" aria-label="Repeat" className="text-text-muted transition hover:text-text-primary">
              <HugeiconsIcon icon={RepeatIcon} size={16} />
            </button>
          </div>
          <div className="group flex w-full items-center gap-3 text-[10px] text-text-muted">
            <span className="w-8 shrink-0 text-right tabular-nums">1:24</span>
            <div className="h-1.5 flex-1 cursor-pointer rounded-full bg-border transition group-hover:h-2">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
            <span className="w-8 shrink-0 tabular-nums">4:11</span>
          </div>
        </div>

        {/* Genre tags */}
        <div className="flex items-center justify-end gap-2">
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-secondary">Pop</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-secondary">Ballad</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-secondary">Duet</span>
        </div>
      </footer>
    </div>
  )
}
