import { useCallback, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'

export type KaraokeVideoApi = {
  pip: boolean
  started: boolean
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  onAir: OnAirTrack | null
  attachVideo: (el: HTMLVideoElement) => () => void
  attachMini: (el: HTMLVideoElement) => () => void
  attachMusic: (el: HTMLAudioElement) => () => void
  setOnAir: (track: OnAirTrack | null) => void
  consumeMusicHandoff: () => boolean
  enterPip: () => void
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
}

export interface PlaylistHandlers {
  previous: () => void
  next: () => void
}

export type RepeatMode = 'off' | 'all' | 'one'

type SourceKind = 'video' | 'mini' | 'music'

const DEFAULT_VOLUME = 0.7

function sameSource(a: HTMLMediaElement, b: HTMLMediaElement): boolean {
  return a.src !== '' && a.src === b.src
}

export function useKaraokeVideo(): KaraokeVideoApi {
  const videoRef = useRef<HTMLMediaElement | null>(null)
  const miniRef = useRef<HTMLMediaElement | null>(null)
  const musicRef = useRef<HTMLMediaElement | null>(null)
  const pipRef = useRef(false)
  const videoVolumeRef = useRef(DEFAULT_VOLUME)
  const repeatModeRef = useRef<RepeatMode>('off')
  const musicHandoffRef = useRef(false)
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
      const isActive = () => active() === el
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

      if (kind === 'video') {
        const mini = miniRef.current
        if (pipRef.current && mini && sameSource(el, mini)) {
          if (mini.currentTime > 1) el.currentTime = mini.currentTime
          if (!mini.paused) void el.play().catch(() => {})
        }
        pipRef.current = false
        setPip(false)
        videoRef.current = el
        el.volume = videoVolumeRef.current
        el.loop = repeatModeRef.current === 'one'
      } else if (kind === 'mini') {
        miniRef.current = el
        el.loop = repeatModeRef.current !== 'off'
      } else {
        musicRef.current = el
      }
      if (active() === el) {
        syncFrom(el)
        if (!el.paused) setStarted(true)
      }

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
          if (pipRef.current && mini && sameSource(el, mini)) {
            mini.currentTime = el.currentTime
            mini.volume = el.volume
            if (!el.paused) void mini.play().catch(() => {})
          } else if (!pipRef.current) {
            const music = musicRef.current
            if (music && sameSource(el, music)) {
              if (el.currentTime > 1) {
                music.currentTime = el.currentTime
                musicHandoffRef.current = true
              } else {
                musicHandoffRef.current = false
              }
            }
          }
        } else if (kind === 'mini') {
          if (miniRef.current === el) miniRef.current = null
        } else {
          if (musicRef.current === el) musicRef.current = null
        }

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

  const consumeMusicHandoff = useCallback(() => {
    const handoff = musicHandoffRef.current
    musicHandoffRef.current = false
    return handoff
  }, [])

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

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    repeatModeRef.current = mode
    setRepeatModeState(mode)
    const consoleLoops = mode === 'one'
    if (videoRef.current) videoRef.current.loop = consoleLoops
    if (miniRef.current) miniRef.current.loop = mode !== 'off'
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
    attachMini,
    attachMusic,
    setOnAir,
    consumeMusicHandoff,
    enterPip,
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

export function useKaraokeVideoControls(): KaraokeVideoApi {
  return useOutletContext<KaraokeVideoApi>()
}
