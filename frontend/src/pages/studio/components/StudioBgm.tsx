import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import lobbyTrack from '../../../assets/video_local/the reason.mp4'
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
 * Autoplay: browsers only allow sound after user interaction. The mount
 * attempt is caught when blocked (keeps ERROR-002 clean) — until a real
 * gesture happens the music simply stays paused and the bar's Play button
 * (a real click) starts it. No resume-on-first-click listeners: they raced
 * the Play button's own pointerdown and cancelled the click's play().
 */
export default function StudioBgm({ player }: { player: KaraokeVideoApi }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { pathname } = useLocation()
  const onConsole = pathname === '/studio/player-queue'
  const { attachMusic, pip } = player
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

  // Play on the studio pages, yield to the console / floating mini player.
  // A rejected play() (no user activation yet) is caught and left paused.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (videoOnAir) {
      el.pause()
      return
    }
    void el.play().catch(() => {})
  }, [videoOnAir])

  return <audio ref={audioRef} src={lobbyTrack} loop preload="auto" aria-hidden="true" />
}
