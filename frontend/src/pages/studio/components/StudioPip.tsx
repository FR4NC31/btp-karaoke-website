import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUp01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import localVideo from '../../../assets/video_local/the-reason.mp4'
import type { KaraokeVideoApi } from '../../../lib/karaoke-player'

export default function StudioPip({ player }: { player: KaraokeVideoApi }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onConsole = pathname === '/studio/player-queue'
  const { attachMini, pip, playing, toggle, onAir } = player

  const visible = pip && !onConsole

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    return attachMini(el)
  }, [attachMini])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (!visible) {
      el.pause()
      return
    }
    void el.play().catch(() => {})
  }, [visible])

  return (
    <aside
      aria-label="Mini player"
      className={`fixed right-4 bottom-24 z-40 w-56 overflow-hidden rounded-xl border border-border bg-black shadow-2xl sm:w-72 ${
        visible ? '' : 'hidden'
      }`}
    >
      <div className="group relative">
        <video
          ref={videoRef}
          src={pip ? (onAir?.src ?? localVideo) : localVideo}
          playsInline
          preload="metadata"
          onClick={toggle}
          className="aspect-video w-full cursor-pointer object-cover"
        />
        <div
          className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-300 ${
            playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={toggle}
            className="pointer-events-auto grid size-10 place-items-center rounded-full bg-black/60 text-text-primary backdrop-blur transition hover:bg-primary"
          >
            <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={18} />
          </button>
        </div>
        <button
          type="button"
          aria-label="Expand"
          onClick={() => navigate('/studio/player-queue')}
          className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-black/60 text-text-primary opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-primary"
        >
          <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
        </button>
      </div>
    </aside>
  )
}
