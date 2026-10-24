import { useCallback, useRef, useState } from 'react'

export type KaraokeVideoApi = {
  pip: boolean
  started: boolean
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  onAir: OnAirTrack | null
  attachVideo: (el: HTMLVideoElement) => () => void
  setOnAir: (track: OnAirTrack | null) => void
  enterPip: () => void
  exitPip: () => void
  toggle: () => void
  seek: (time: number) => void
  changeVolume: (volume: number) => void
  repeatMode: RepeatMode
  setRepeatMode: (mode: RepeatMode) => void
  shuffle: boolean
  setShuffle: (shuffle: boolean) => void
  shuffleSeed: number
  previous: () => void
  next: () => void
  attachPlaylist: (handlers: PlaylistHandlers | null) => () => void
}

export interface OnAirTrack {
  title: string
  subtitle: string
  src: string
  coverUrl: string | null
  kind: 'video' | 'music'
  mediaId?: string | null
  album?: string | null
  duration?: string | null
}

export interface PlaylistHandlers {
  previous: () => void
  next: () => void
}

export type RepeatMode = 'off' | 'all' | 'one'

/** The single player element is only restyled between these presentation modes. */
export type PlayerViewMode = 'expanded' | 'mini' | 'hidden'

const DEFAULT_VOLUME = 0.7

/**
 * Owns the single studio media element's transport state.
 *
 * The element itself lives in the persistent StudioPlayer surface, so it is
 * never unmounted when the user moves between studio routes. Hidden/mini/
 * expanded are presentation modes, not different players.
 */
export function useKaraokeVideo(): KaraokeVideoApi {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoVolumeRef = useRef(DEFAULT_VOLUME)
  const repeatModeRef = useRef<RepeatMode>('off')
  const playlistRef = useRef<PlaylistHandlers | null>(null)

  const [pip, setPip] = useState(false)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [onAir, setOnAirState] = useState<OnAirTrack | null>(null)
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>('off')
  const [shuffle, setShuffleState] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  const setOnAir = useCallback((track: OnAirTrack | null) => {
    setOnAirState(track)
  }, [])

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
    (el: HTMLVideoElement) => {
      const isActive = () => videoRef.current === el
      const syncTime = () => {
        if (isActive()) setCurrentTime(el.currentTime)
      }
      const syncDuration = () => {
        if (isActive()) setDuration(Number.isFinite(el.duration) ? el.duration : 0)
      }
      const syncPlay = () => {
        setStarted(true)
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

      videoRef.current = el
      el.volume = videoVolumeRef.current
      el.loop = repeatModeRef.current === 'one'
      syncFrom(el)
      if (!el.paused) setStarted(true)

      return () => {
        el.removeEventListener('timeupdate', syncTime)
        el.removeEventListener('loadedmetadata', syncDuration)
        el.removeEventListener('durationchange', syncDuration)
        el.removeEventListener('play', syncPlay)
        el.removeEventListener('pause', syncPause)
        el.removeEventListener('ended', syncPause)
        el.removeEventListener('volumechange', syncVolume)

        if (videoRef.current === el) videoRef.current = null
        resetTransport()
      }
    },
    [resetTransport, syncFrom],
  )

  const attachVideo = useCallback((el: HTMLVideoElement) => register(el), [register])

  const enterPip = useCallback(() => {
    setPip(true)
  }, [])

  const exitPip = useCallback(() => {
    setPip(false)
  }, [])

  const toggle = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => {})
    else el.pause()
  }, [])

  const seek = useCallback((time: number) => {
    const el = videoRef.current
    if (!el || !Number.isFinite(time)) return
    el.currentTime = time
    setCurrentTime(time)
  }, [])

  const changeVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next))
    setVolume(clamped)
    const el = videoRef.current
    if (!el) return
    el.volume = clamped
    videoVolumeRef.current = clamped
  }, [])

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    repeatModeRef.current = mode
    setRepeatModeState(mode)
    if (videoRef.current) videoRef.current.loop = mode === 'one'
  }, [])

  const setShuffle = useCallback((next: boolean) => {
    setShuffleState(next)
    if (next) setShuffleSeed(Math.random())
  }, [])

  const attachPlaylist = useCallback((handlers: PlaylistHandlers | null) => {
    playlistRef.current = handlers
    return () => {
      if (playlistRef.current === handlers) playlistRef.current = null
    }
  }, [])

  const previous = useCallback(() => {
    playlistRef.current?.previous()
  }, [])

  const next = useCallback(() => {
    playlistRef.current?.next()
  }, [])

  return {
    pip,
    started,
    playing,
    currentTime,
    duration,
    volume,
    onAir,
    attachVideo,
    setOnAir,
    enterPip,
    exitPip,
    toggle,
    seek,
    changeVolume,
    repeatMode,
    setRepeatMode,
    shuffle,
    setShuffle,
    shuffleSeed,
    previous,
    next,
    attachPlaylist,
  }
}
