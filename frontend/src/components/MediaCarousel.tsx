import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

type MediaCarouselProps = {
  label: string
  header: ReactNode
  aside?: ReactNode
  children: ReactNode
  count?: number
  as?: 'div' | 'ul'
  itemClassName?: string
}

export default function MediaCarousel({
  label,
  header,
  aside,
  children,
  count,
  as = 'div',
  itemClassName = '[&>*]:w-[min(100%,20rem)]',
}: MediaCarouselProps) {
  const railRef = useRef<HTMLDivElement | HTMLUListElement | null>(null)
  const [edges, setEdges] = useState({ left: false, right: true })
  const hasItems = count !== 0

  const measure = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }))
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, children])

  function scroll(direction: -1 | 1) {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const railClass = `flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:snap-start ${itemClassName}`

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {header}
        <div className="ml-auto flex items-center gap-3">
          {aside}
          {hasItems && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Scroll ${label} left`}
                disabled={!edges.left}
                onClick={() => scroll(-1)}
                className="rounded-lg border border-border bg-surface-elevated p-2 text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              </button>
              <button
                type="button"
                aria-label={`Scroll ${label} right`}
                disabled={!edges.right}
                onClick={() => scroll(1)}
                className="rounded-lg border border-border bg-surface-elevated p-2 text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {hasItems &&
        (as === 'ul' ? (
          <ul
            ref={(el) => {
              railRef.current = el
            }}
            onScroll={measure}
            className={railClass}
          >
            {children}
          </ul>
        ) : (
          <div
            ref={(el) => {
              railRef.current = el
            }}
            onScroll={measure}
            className={railClass}
          >
            {children}
          </div>
        ))}
    </>
  )
}
