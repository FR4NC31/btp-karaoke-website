import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import lobbyTrack from '../../../assets/video_local/the-reason.mp4'
import type { KaraokeVideoApi } from '../../../lib/karaoke-player'

const BGM_VOLUME = 0.35

export default function StudioBgm({ player }: { player: KaraokeVideoApi }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { pathname } = useLocation()
  const onConsole = pathname === '/studio/player-queue'
  const { attachMusic, consumeMusicHandoff, pip, onAir } = player
  const videoOnAir = onConsole || pip
  const trackSrc = onAir?.src ?? lobbyTrack

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = BGM_VOLUME
    return attachMusic(el)
  }, [attachMusic])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (videoOnAir) {
      el.pause()
      return
    }
    if (consumeMusicHandoff()) void el.play().catch(() => {})
  }, [videoOnAir, consumeMusicHandoff])

  return <audio ref={audioRef} src={trackSrc} loop preload="auto" aria-hidden="true" />
}
