# Design System Pass — btp-karaoke/frontend

**Status:** approved, NOT started.

> **Stale assumption (2026-10-10):** the AUTH-008 references below predate real
> Better Auth and assume a *disabled* Google button with a `Soon` chip. Google
> sign-in is now wired up — AUTH-008 asserts the hand-off to Google instead.
> Render the Google button as a working `variant="secondary"` control, and do
> not restore the disabled state or the prototype notice.
**Scope:** tokens + shared Button/Card/Badge/IconButton + apply across pages + font optimization + nav cleanup. No page restructuring, no router changes, no auth changes, no Studio split.
**User decisions:** frontend-only (keep mock auth) · convert TTF → WOFF2 · remove dead nav items (Songs/About/Contacts) · design-system-only pass size.
**Validate:** `lint` → `tsc -b` → `build` → `test:e2e:smoke` (CI PR gate). E2E pins protect against regressions.

---

## Phase A — Design tokens (`src/index.css`)

Current `@theme` has colors + fonts only. Add:

| Token | Value | Utility | Purpose |
|---|---|---|---|
| `--color-primary-active` | `#a02222` (darker than hover `#b92323`) | `bg-primary-active` | Button pressed state — fills missing active |
| `--radius-card` | `0.75rem` | `rounded-card` | Kill `rounded-lg/xl/2xl` card mix |
| `--shadow-menu` | `0 10px 15px -3px rgb(0 0 0/.4), 0 4px 6px -4px rgb(0 0 0/.4)` | `shadow-menu` | Replace inline `shadow-xl shadow-black/40` |
| `--text-2xs` | `0.625rem` (10px) | `text-2xs` | Replace all 3 ad-hoc sizes `text-[9px]`, `text-[10px]`, `text-[11px]` → 1 token (25+ sites) |

Also in `@layer base`:
- `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px }` — keyboard focus everywhere, zero per-component work.

Not added (unused → no unnecessary colors): `info`, extra accents, spacing scale (Tailwind defaults already consistent).

**Test risk:** none — no test asserts font-size, radius, or shadows.

## Phase B — Shared components (new `src/components/ui/`)

Tiny `cn()` helper first — `src/lib/cn.ts`:

```ts
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
```

### 1. `Button.tsx`

```ts
type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg' | 'chip'
```

- `primary`: `bg-primary text-text-primary hover:bg-primary-hover active:bg-primary-active`
- `secondary`: `border border-border bg-surface-elevated text-text-secondary hover:text-text-primary`
- `soft`: `border border-primary/40 bg-primary-soft text-primary hover:border-primary`
- `ghost`: `text-text-secondary hover:text-text-primary`
- sizes: `sm px-3 py-1.5 text-xs` / `md px-4 py-2.5 text-sm` / `lg px-6 py-3 font-medium` / `chip px-4 py-2 text-xs uppercase tracking-wide`
- base: `rounded-lg inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed`
- **Exports both:** `<Button>` component AND `buttonClassName(variant, size, className?)` — Links (`<Link>`) reuse classes without wrapper hacks
- No `loading` prop — zero async code exists (avoid speculative API)

### 2. `IconButton.tsx`

- props: `label: string` (→ `aria-label`, TS-enforced), `variant: 'ghost' | 'solid'`, `size: 'sm' | 'md'`
- solid+md = round `size-9 rounded-full bg-primary` (player play/pause)
- rest = bare icon w/ hover + focus-visible ring

### 3. `Card.tsx`

```ts
interface CardProps { as?: 'div' | 'article' | 'section'; padding?: 'none' | 'sm' | 'md' | 'lg'; ...HTMLAttributes }
```

- base: `rounded-card border border-border bg-surface`
- `as` keeps semantic elements → **`as="article"` preserves `main article` count test (KARAOKE-001)**; `as="section"` for featured block
- hover/group styles via `className` passthrough (no variant explosion)

### 4. `Badge.tsx`

- `variant: 'solid' | 'soft' | 'outline'`, `size: 'sm' | 'xs'`
- solid = `bg-primary text-text-primary rounded-full`
- soft = `bg-primary-soft text-primary rounded-full`
- outline = `border border-border text-text-secondary rounded-full`
- `className` passthrough for uppercase/tracking cases

**Not building:** Modal, Toast, Table, Skeleton, Select, Heading/Text wrappers — zero usage sites (only relevant components).

## Phase C — Apply across existing pages (mechanical, JSX-preserving)

| File | Change |
|---|---|
| `Home.tsx` | 2 CTAs → `buttonClassName('primary'|'secondary','lg')` on Links; 3 feature `article` → `<Card as="article" padding="lg">` |
| `auth/SignIn.tsx` | submit → `<Button className="w-full">`; Google → `<Button variant="secondary" disabled>` (keeps `Soon` text — move chip → `<Badge size="xs">`, keeps AUTH-008 assertions); shell card → `<Card padding="lg" className="w-full max-w-md">` |
| `auth/SignUp.tsx` | same submit + shell; `role="alert"` error `<p>` untouched (AUTH pins text) |
| `Studio.tsx` | 3 featured CTAs → Button (primary/secondary/soft, md); genre chips → `<Button variant={active?'primary':'outline'} size="chip">` (names `Rock`/`All Genres`/`Ballad` exact — KARAOKE-002); table Play → Button soft sm (`Play` name ×5 — KARAOKE-003); collection cards → `<Card as="article" padding="none" className="group overflow-hidden hover:border-primary/50">` — **keeps `main article` count = 6**; topbar/status/player chips → Badge; transport+like+play → IconButton (names `Play`/`Pause`/`Like`/`Shuffle`… preserved — PLAYER tests); jukebox mini → Card sm; empty-state box → Card; profile dropdown inline **untouched** (feature logic, out of scope); sidebar rows **untouched** (KARAOKE-004 pins `bg-primary-soft` class) |
| `RootLayout.tsx` | delete Songs/About/Contacts `<li>`s; hamburger → `<IconButton label=…>` (mobile nav test names preserved) |
| `Placeholder.tsx` | hardcoded stripe gradient → keep (works, tokenizing = churn) |

All `text-[9px|10px|11px]` → `text-2xs`; card radii → `rounded-card`.

**Invariants verified after each file:** accessible names, `main article`=6, single `h1`/page, `<footer>` stays direct child (role `contentinfo`), sidebar active keeps `bg-primary-soft`, `Soon` + disabled Google, `BTP MUSIC PRODUCTION`, `Viewing N of 6 sets`.

## Phase D — Fonts TTF → WOFF2

1. Temp dir (`$env:TEMP\opencode\fontconv`) → `npm i wawoff2` there — **no repo dependency added**
2. Node script: convert 7 files `frontend/src/assets/Fonts/**/**.ttf` → same name `.woff2`, log sizes
3. `index.css` `@font-face`: `format('truetype')` → `format('woff2')`, paths → `.woff2`
4. Delete the 7 `.ttf` (git history keeps them)
5. `index.html`: `<link rel="preload" as="font" type="font/woff2" crossorigin>` for 2 critical files only — PlusJakartaSans-Regular + BarlowCondensed-Bold (body + h1). Not all 7 — over-preloading hurts
6. Check: `ERROR-003` (no failed requests) + visual font check

Expected: ~700 KB → ~200–250 KB fonts.

## Phase E — Validation

```
cd frontend
npm run lint
npx tsc -b
npm run build
npm run test:e2e:smoke      # PR gate: smoke → home→signin→studio→filter→player→logout
```

Then dev server visual pass: Home / SignIn / SignUp / Studio / 404 at 375px, 768px, 1280px — check radius unification, focus rings, button states didn't shift layout.
Full `npm run test:e2e` only if backend up (ERROR-004 needs `BACKEND_URL`).

---

## Explicitly deferred (backlog)

- P1: split `Studio.tsx` (525 ln → data + 8 components)
- P1: error boundary + router `errorElement`
- P1: SignIn error-state parity with SignUp
- P1: search input label, profile-menu focus trap, progress bar keyboard access
- P2: strict TS (already passes — 1-line config add to tsconfig.app.json)
- P2: skeleton/loading states (no data layer yet)
- P2: auth shell extraction (SignIn/SignUp byte-identical wrappers)
- P3: README/title cleanup (`<title>frontend</title>`), dead-file deletion (App.tsx, Dashboard.tsx, unused assets, committed playwright-report/ + test-results/)

## Risks

| Risk | Mitigation |
|---|---|
| E2E class/name pins break | Invariants table above; smoke run after Phase C |
| Card `as` breaks `main article` count | `as="article"` required at 2 collection sites — asserted in review |
| Font conversion tool fails on Windows | fallback: keep TTF (diff-only revert of Phase D.3) |
| 10px unification shifts tiny text | 1px max shift, no test depends on it |
