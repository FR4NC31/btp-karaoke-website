import FeaturedCollection from './components/FeaturedCollection'
import CollectionsSection from './components/CollectionsSection'
import TelemetryTable from './components/TelemetryTable'

/**
 * /studio index: the discovery content shown inside StudioShell.
 * All region state lives in the region components themselves.
 */
export default function StudioHome() {
  return (
    <div className="space-y-8">
      <FeaturedCollection />
      <CollectionsSection />
      <TelemetryTable />
    </div>
  )
}
