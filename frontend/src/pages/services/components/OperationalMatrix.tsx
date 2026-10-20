import SectionEyebrow from '../../../components/SectionEyebrow'
import { matrix } from '../data'

/** The quick service matrix table at the bottom of the page. */
export default function OperationalMatrix() {
  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-wide uppercase">Operational Overview</h2>
          <SectionEyebrow>Quick Service Matrix</SectionEyebrow>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-text-muted">
          Summary of turnaround targets, primary deliverables, and booking methods across all four service wings.
        </p>
      </div>

      <div data-services-reveal className="mt-8 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] tracking-widest text-text-muted uppercase">
              <th scope="col" className="px-5 py-4 font-semibold">Service Tier</th>
              <th scope="col" className="px-5 py-4 font-semibold">Core Scope</th>
              <th scope="col" className="px-5 py-4 font-semibold">Primary Deliverable</th>
              <th scope="col" className="px-5 py-4 font-semibold">Turnaround / Slot</th>
              <th scope="col" className="px-5 py-4 font-semibold">Action Desk</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.tier} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-5 py-4 font-semibold text-text-primary">{row.tier}</th>
                <td className="px-5 py-4 text-text-secondary">{row.scope}</td>
                <td className="px-5 py-4 text-text-secondary">{row.deliverable}</td>
                <td className="px-5 py-4 text-text-secondary">{row.turnaround}</td>
                <td className="px-5 py-4 font-bold tracking-wide text-text-primary uppercase">{row.desk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
