/**
 * Loading skeleton for /studio/profile. Shape mirrors ProfilePage —
 * tabs → identity card → personal details → location → audio preferences —
 * so the placeholder and the real AccountTab share one layout.
 *
 * Pure divs on purpose: no h1/h2/button/role inside, so pinned E2E a11y
 * assertions only ever match the real content underneath.
 */
function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated motion-reduce:animate-none ${className}`}
    />
  )
}

function DetailTileSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <Bar className="h-2.5 w-24" />
      <Bar className="mt-2.5 h-4 w-40 max-w-full" />
      <Bar className="mt-2 h-2.5 w-32 max-w-full" />
    </div>
  )
}

export default function ProfileSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-5xl space-y-6">
      <span className="sr-only">Loading profile</span>

      {/* Profile tabs + member status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-6">
          <Bar className="h-4 w-24" />
          <Bar className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-3 w-16" />
        </div>
      </div>

      {/* Identity card */}
      <section className="flex flex-wrap items-start gap-5 rounded-xl border border-border bg-surface p-6">
        <Bar className="size-24 shrink-0 rounded-xl" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Bar className="h-8 w-64 max-w-full" />
            <Bar className="h-5 w-28 rounded" />
          </div>
          <Bar className="mt-2.5 h-3.5 w-52 max-w-full" />
          <div className="mt-4 max-w-xl space-y-2">
            <Bar className="h-3.5 w-full" />
            <Bar className="h-3.5 w-2/3" />
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Bar className="h-9 w-32 rounded-lg" />
          <Bar className="h-9 w-24 rounded-lg" />
        </div>
      </section>

      {/* Personal details */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bar className="size-[18px] rounded-sm" />
            <Bar className="h-5 w-44" />
          </div>
          <Bar className="h-3 w-16" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailTileSkeleton />
          <DetailTileSkeleton />
          <DetailTileSkeleton />
        </div>
      </section>

      {/* Location */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bar className="size-[18px] rounded-sm" />
            <Bar className="h-5 w-24" />
          </div>
          <Bar className="h-3 w-24" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <DetailTileSkeleton />
          <DetailTileSkeleton />
          <DetailTileSkeleton />
        </div>
        <Bar className="mt-3 h-2.5 w-72 max-w-full" />
      </section>

      {/* Singing & audio preferences */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bar className="size-[18px] rounded-sm" />
            <Bar className="h-5 w-64 max-w-full" />
          </div>
          <Bar className="h-5 w-16 rounded" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailTileSkeleton />
          <DetailTileSkeleton />
          <DetailTileSkeleton />
          <DetailTileSkeleton />
        </div>
      </section>
    </div>
  )
}
