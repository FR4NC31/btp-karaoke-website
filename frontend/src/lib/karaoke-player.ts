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
 *
 * The console can play the bundled master or an uploaded catalog file, so the
 * transport also tracks the on-air track (`onAir`): the bar shows its
 * metadata and the mini mirrors its source. Position handoffs (console →
 * mini, console → lobby) are gated on matching sources, so an uploaded song
 * never jumps the lobby's own timeline. The lobby itself never autoplays:
 * StudioBgm starts it only on a real user choice (the bar's Play) or when a
 * console exit flags a handoff for it to consume.
 *
 * Only the console registers a playlist (`attachPlaylist`): its queue skip
 * handlers back the bar's Previous/Next buttons and the auto-advance when a
 * song ends. Other studio pages register nothing, so the buttons stay inert.
 * The bar's repeat/shuffle modes live here too: 'one' loops the registered
 * console video (and 'all' loops the floating mini, which has no queue),
 * while 'all' and shuffle are otherwise read by the console's playlist (wrap
 * the queue; present it in a random order and draw songs at random — see
 * `shuffleSeed`).
 */
export type KaraokeVideoApi = {
  /** True while the in-app PiP mini player holds the session. */
  pip: boolean
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  /**
   * What the console currently has on air — null means only the lobby track
   * is around. Drives the bar's track metadata and the mini player's source.
   */
  onAir: OnAirTrack | null
  /**
   * Attach the console page's <video> element to the shared transport and
   * return the detach cleanup (call from an effect: `return attachVideo(el)`).
   */
  attachVideo: (el: HTMLVideoElement) => () => void
  /** Register the shell's floating mini player <video> (StudioPip). */
  attachMini: (el: HTMLVideoElement) => () => void
  /** Same contract for the lobby music <audio> (StudioBgm). */
  attachMusic: (el: HTMLAudioElement) => () => void
  /** Console pages announce their track here (null clears it). */
  setOnAir: (track: OnAirTrack | null) => void
  /**
   * True once after the console handed its song to the lobby track on exit
   * (the same file, position > 1s moved onto the <audio>). StudioBgm consumes
   * it to resume exactly that handoff — the lobby never autoplays without a
   * user choice.
   */
  consumeMusicHandoff: () => boolean
  /** Console PiP button: arm the mini player, then navigate away. */
  enterPip: () => void
  toggle: () => void
  seek: (time: number) => void
  changeVolume: (volume: number) => void
  /** Repeat cycle from the bar: 'one' loops the registered videos. */
  repeatMode: RepeatMode
  setRepeatMode: (mode: RepeatMode) => void
  /** Shuffle flag from the bar: the console shuffles — random rail order, random draws. */
  shuffle: boolean
  setShuffle: (shuffle: boolean) => void
  /**
   * Fresh every time shuffle switches on: the console derives its random
   * queue order from it, so the order is random yet pure to render — and
   * stays put while the same shuffled round plays out.
   */
  shuffleSeed: number
  /** Skip back a song on the console queue (no-op with no playlist). */
  previous: () => void
  /** Skip forward a song on the console queue (no-op with no playlist). */
  next: () => void
  /**
   * Register the console's queue skip handlers for the bar's Previous/Next
   * buttons; returns the detach cleanup. Only the console registers one, so
   * the buttons stay inert on the other studio pages.
   */
  attachPlaylist: (handlers: PlaylistHandlers | null) => () => void
}

/** The track the console is playing — a catalog row or the bundled master. */
export interface OnAirTrack {
  title: string
  subtitle: string
  /** Resolved media URL: an uploaded file or the bundled local master. */
  src: string
  /** Cover/thumbnail the player bar shows; null = the default art. */
  coverUrl: string | null
  kind: 'video' | 'music'
}

/**
 * What the console registers for the bar's Previous/Next buttons: skipping
 * walks the console's lounge queue (only /studio/player-queue has one).
 */
export interface PlaylistHandlers {
  previous: () => void
  next: () => void
}

/**
 * Bar repeat cycle: 'off' stops at the queue's end, 'all' wraps the console's
 * queue around (the floating mini, which has no queue, loops its one song
 * instead), 'one' loops the element itself (the console never sees an `ended`
 * then, so the auto-advance stays put).
 */
export type RepeatMode = 'off' | 'all' | 'one'

type SourceKind = 'video' | 'mini' | 'music'

/** Default loudness for freshly registered videos (keeps the old 2/3 bar). */
const DEFAULT_VOLUME = 0.7

/** Same resolved media URL — position handoffs only make sense on one file. */
function sameSource(a: HTMLMediaElement, b: HTMLMediaElement): boolean {
  return a.src !== '' && a.src === b.src
}

export function useKaraokeVideo(): KaraokeVideoApi {
  const videoRef = useRef<HTMLMediaElement | null>(null)
  const miniRef = useRef<HTMLMediaElement | null>(null)
  const musicRef = useRef<HTMLMediaElement | null>(null)
  // PiP flags live in a ref too: the register callbacks must see the armed
  // state synchronously during the navigation commit, before re-renders.
  const pipRef = useRef(false)
  const videoVolumeRef = useRef(DEFAULT_VOLUME)
  // Repeat mode lives in a ref too: a freshly attached video must pick up the
  // current mode synchronously, before the bar's state re-render lands.
  const repeatModeRef = useRef<RepeatMode>('off')
  // Set when the console exits with the lobby track as its heir (see the
  // detach below); StudioBgm consumes it to resume the handed-off song.
  const musicHandoffRef = useRef(false)
  // The console's queue skip handlers (bar Previous/Next). A ref, like the
  // PiP flag, so the bar always calls the latest registered playlist.
  const playlistRef = useRef<PlaylistHandlers | null>(null)

  const [pip, setPip] = useState(false)
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
        // player's position and play state, then disarm it. Only when the
        // mini holds the same source — a fresh song card replaces it.
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
        // The floating player has no playlist behind it, so repeat all and
        // repeat one both loop its single song (its old behavior).
        el.loop = repeatModeRef.current !== 'off'
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
          if (pipRef.current && mini && sameSource(el, mini)) {
            // PiP armed: the floating player takes the session where the
            // video left it — the lobby stays out of it.
            mini.currentTime = el.currentTime
            mini.volume = el.volume
            if (!el.paused) void mini.play().catch(() => {})
          } else if (!pipRef.current) {
            // Plain exit → hand the song to the lobby track, synced: a video
            // that made real progress moves its position onto the lobby
            // <audio> and flags the handoff (StudioBgm's route effect
            // consumes the flag and resumes it — a fresh studio entry never
            // autoplays the lobby). Only when both play the same file — an
            // uploaded song keeps its place instead of jumping the lobby's
            // own timeline. Dev-only quirk: StrictMode invokes the console's
            // attach effect twice, so this also fires once right after a
            // (re)entry — it only nudges the parked, silent lobby track;
            // production mounts once.
            const music = musicRef.current
            if (music && sameSource(el, music)) {
              if (el.currentTime > 1) {
                music.currentTime = el.currentTime
                musicHandoffRef.current = true
              } else {
                // No progress → nothing to hand over; also clears a stale
                // flag the StrictMode early detach above may have left.
                musicHandoffRef.current = false
              }
            }
          }
          // "Now playing" follows the console's track: a floating PiP keeps
          // it on air, a plain exit drops back to the lobby master.
          if (!pipRef.current) setOnAirState(null)
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
    // Only repeat-one loops the console element itself: an element loop
    // suppresses `ended`, so repeat-all must be wrapped by the playlist. The
    // floating mini has no playlist, so 'all' loops it there.
    const consoleLoops = mode === 'one'
    if (videoRef.current) videoRef.current.loop = consoleLoops
    if (miniRef.current) miniRef.current.loop = mode !== 'off'
  }, [])

  const setShuffle = useCallback((next: boolean) => {
    setShuffleState(next)
    // Seed the console's random queue order here — this is an event handler,
    // never render, so the console can derive the order purely.
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

/** StudioShell exposes the media api through the router outlet context. */
export function useKaraokeVideoControls(): KaraokeVideoApi {
  return useOutletContext<KaraokeVideoApi>()
}
