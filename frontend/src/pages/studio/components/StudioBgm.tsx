import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import lobbyTrack from '../../../assets/video_local/the-reason.mp4'
import type { KaraokeVideoApi } from '../../../lib/karaoke-player'

/** Background loudness — low enough to sit under the chrome. */
const BGM_VOLUME = 0.35

/**
 * Lobby background music for the studio shell (and only the studio — it is
 * mounted by StudioShell, so landing/about/contact never hear it).
 *
 * Placeholder source: the local karaoke track's audio — the project has no
 * separate lobby track yet; swap `lobbyTrack` when one lands. The element is
 * registered with the shared transport, so the PlayerBar controls it (play,
 * seek, volume) on every studio page except the console, where it yields to
 * the karaoke <video>.
 *
 * No autoplay: entering the studio leaves the music paused until the user
 * actually chooses something — the bar's Play button (a real click) or a
 * console session handed back on exit (KARAOKE-010; the transport flags the
 * handoff). A play() the browser still rejects is caught and the music stays
 * paused (keeps ERROR-002 clean).
 */
export default function StudioBgm({ player }: { player: KaraokeVideoApi }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { pathname } = useLocation()
  const onConsole = pathname === '/studio/player-queue'
  const { attachMusic, consumeMusicHandoff, pip } = player
  // The lobby yields wherever a video session is on air: the console itself
  // or the floating PiP mini player.
  const videoOnAir = onConsole || pip

  // Register the element with the shared transport once (bar control).
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = BGM_VOLUME
    return attachMusic(el)
  }, [attachMusic])

  // Pause wherever a video session is on air. Otherwise start ONLY a
  // console handoff (the user picked a song there): a fresh studio entry
  // stays silent until the bar's Play. A rejected play() (no user
  // activation yet) is caught and left paused.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (videoOnAir) {
      el.pause()
      return
    }
    if (consumeMusicHandoff()) void el.play().catch(() => {})
  }, [videoOnAir, consumeMusicHandoff])

  return <audio ref={audioRef} src={lobbyTrack} loop preload="auto" aria-hidden="true" />
}
