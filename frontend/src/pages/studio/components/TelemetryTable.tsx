import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import { telemetry } from '../data'

export default function TelemetryTable() {
  return (
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
  )
}
