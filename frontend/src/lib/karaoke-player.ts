import { useCallback, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'

/**
 * Shared media transport for the studio shell.
 *
 * Three sources can register: the console's karaoke <video>, the floating
 * in-app PiP <video> (StudioPip) and the lobby background music
 * (StudioBgm's <audio>). Priority: console video → PiP mini while armed →
 * lobby music, so the same PlayerBar drives real playback everywhere. The
 * console hands its session to the mini on exit when PiP is armed (position,
 * loudness, play state), and reclaims it on re-entry. Mirrors the
 * auth-dialog pattern: shell state exposed to pages through the router
 * outlet context.
 */
export type KaraokeVideoApi = {
  /** True while the in-app PiP mini player holds the session. */
  pip: boolean
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  /**
   * Attach the console page's <video> element to the shared transport and
   * return the detach cleanup (call from an effect: `return attachVideo(el)`).
   */
  attachVideo: (el: HTMLVideoElement) => () => void
  /** Register the shell's floating mini player <video> (StudioPip). */
  attachMini: (el: HTMLVideoElement) => () => void
  /** Same contract for the lobby music <audio> (StudioBgm). */
  attachMusic: (el: HTMLAudioElement) => () => void
  /** Console PiP button: arm the mini player, then navigate away. */
  enterPip: () => void
  toggle: () => void
  seek: (time: number) => void
  changeVolume: (volume: number) => void
  /** Loop flag for the registered videos (bar's repeat button). */
  setLoop: (loop: boolean) => void
}

type SourceKind = 'video' | 'mini' | 'music'

/** Default loudness for freshly registered videos (keeps the old 2/3 bar). */
const DEFAULT_VOLUME = 0.7

export function useKaraokeVideo(): KaraokeVideoApi {
  const videoRef = useRef<HTMLMediaElement | null>(null)
  const miniRef = useRef<HTMLMediaElement | null>(null)
  const musicRef = useRef<HTMLMediaElement | null>(null)
  // PiP flags live in a ref too: the register callbacks must see the armed
  // state synchronously during the navigation commit, before re-renders.
  const pipRef = useRef(false)
  const videoVolumeRef = useRef(DEFAULT_VOLUME)
  const loopRef = useRef(false)

  const [pip, setPip] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)

  /** The element the bar controls: console video, then armed PiP, then lobby. */
  const active = () => videoRef.current ?? (pipRef.current ? miniRef.current : null) ?? musicRef.current

  const syncFrom = useCallback((el: HTMLMediaElement) => {
    setPlaying(!el.paused)
    setCurrentTime(el.currentTime)
    setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    setVolume(el.volume)
  }, [])

  const resetTransport = useCallback(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const register = useCallback(
    (el: HTMLMediaElement, kind: SourceKind) => {
      // Per-element handlers ignore events unless the element is the active
      // source, so the paused lobby track (or a parked mini player) can never
      // fight the element the bar is actually driving.
      const isActive = () => active() === el
      const syncTime = () => {
        if (isActive()) setCurrentTime(el.currentTime)
      }
      const syncDuration = () => {
        if (isActive()) setDuration(Number.isFinite(el.duration) ? el.duration : 0)
      }
      const syncPlay = () => {
        if (isActive()) setPlaying(true)
      }
      const syncPause = () => {
        if (isActive()) setPlaying(false)
      }
      const syncVolume = () => {
        if (isActive()) setVolume(el.volume)
      }

      el.addEventListener('timeupdate', syncTime)
      el.addEventListener('loadedmetadata', syncDuration)
      el.addEventListener('durationchange', syncDuration)
      el.addEventListener('play', syncPlay)
      el.addEventListener('pause', syncPause)
      el.addEventListener('ended', syncPause)
      el.addEventListener('volumechange', syncVolume)

      if (kind === 'video') {
        // Console (re)entry ends any floating session: take the mini
        // player's position and play state, then disarm it.
        const mini = miniRef.current
        if (pipRef.current && mini) {
          if (mini.currentTime > 1) el.currentTime = mini.currentTime
          if (!mini.paused) void el.play().catch(() => {})
        }
        pipRef.current = false
        setPip(false)
        videoRef.current = el
        el.volume = videoVolumeRef.current
        el.loop = loopRef.current
      } else if (kind === 'mini') {
        miniRef.current = el
        el.loop = loopRef.current
      } else {
        musicRef.current = el
      }
      if (active() === el) syncFrom(el)

      return () => {
        el.removeEventListener('timeupdate', syncTime)
        el.removeEventListener('loadedmetadata', syncDuration)
        el.removeEventListener('durationchange', syncDuration)
        el.removeEventListener('play', syncPlay)
        el.removeEventListener('pause', syncPause)
        el.removeEventListener('ended', syncPause)
        el.removeEventListener('volumechange', syncVolume)

        if (kind === 'video') {
          if (videoRef.current === el) videoRef.current = null
          const mini = miniRef.current
          if (pipRef.current && mini) {
            // PiP armed: the floating player takes the session where the
            // video left it — the lobby stays out of it.
            mini.currentTime = el.currentTime
            mini.volume = el.volume
            if (!el.paused) void mini.play().catch(() => {})
          } else {
            // Plain exit → hand the song to the lobby track, synced: a video
            // that made real progress moves its position onto the lobby
            // <audio> (StudioBgm's route effect then resumes it from there).
            // Dev-only quirk: StrictMode invokes the console's attach effect
            // twice, so this also fires once right after a (re)entry — it
            // only nudges the parked, silent lobby track; production mounts
            // the effect a single time.
            const music = musicRef.current
            if (music && el.currentTime > 1) music.currentTime = el.currentTime
          }
        } else if (kind === 'mini') {
          if (miniRef.current === el) miniRef.current = null
        } else {
          if (musicRef.current === el) musicRef.current = null
        }

        // Fall back to the next source (or reset when nothing is left).
        const next = active()
        if (next) syncFrom(next)
        else resetTransport()
      }
    },
    [resetTransport, syncFrom],
  )

  const attachVideo = useCallback((el: HTMLVideoElement) => register(el, 'video'), [register])
  const attachMini = useCallback((el: HTMLVideoElement) => register(el, 'mini'), [register])
  const attachMusic = useCallback((el: HTMLAudioElement) => register(el, 'music'), [register])

  const enterPip = useCallback(() => {
    pipRef.current = true
    setPip(true)
  }, [])

  const toggle = useCallback(() => {
    const el = active()
    if (!el) return
    if (el.paused) void el.play().catch(() => {})
    else el.pause()
  }, [])

  const seek = useCallback((time: number) => {
    const el = active()
    if (!el || !Number.isFinite(time)) return
    el.currentTime = time
    setCurrentTime(time)
  }, [])

  const changeVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next))
    setVolume(clamped)
    const el = active()
    if (!el) return
    el.volume = clamped
    if (el === videoRef.current || el === miniRef.current) videoVolumeRef.current = clamped
  }, [])

  const setLoop = useCallback((loop: boolean) => {
    loopRef.current = loop
    if (videoRef.current) videoRef.current.loop = loop
    if (miniRef.current) miniRef.current.loop = loop
  }, [])

  return {
    pip,
    playing,
    currentTime,
    duration,
    volume,
    attachVideo,
    attachMini,
    attachMusic,
    enterPip,
    toggle,
    seek,
    changeVolume,
    setLoop,
  }
}

/** StudioShell exposes the media api through the router outlet context. */
export function useKaraokeVideoControls(): KaraokeVideoApi {
  return useOutletContext<KaraokeVideoApi>()
}
