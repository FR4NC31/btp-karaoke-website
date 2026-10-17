import VideoSongSection from './components/VideoSongSection'
import MusicPlayerSection from './components/MusicPlayerSection'
import RadioSection from './components/RadioSection'

/**
 * /studio index: the studio media hub shown inside StudioShell.
 * Three sections, top to bottom: Video Song, Music Player, Radio.
 * All region state lives in the region components themselves.
 */
export default function StudioHome() {
  return (
    <div className="space-y-8">
      <VideoSongSection />
      <MusicPlayerSection />
      <RadioSection />
    </div>
  )
}
