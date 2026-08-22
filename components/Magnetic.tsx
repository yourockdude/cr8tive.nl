'use client'

import { useRef, type ReactNode } from 'react'

/**
 * The body and the label are pulled toward the cursor at different strengths,
 * so the label lags slightly behind the shell instead of the whole button
 * sliding as one block.
 */
export function Magnetic({
  children,
  strength = 0.38,
  textStrength,
  className,
}: {
  children: ReactNode
  strength?: number
  textStrength?: number
  className?: string
}) {
  const node = useRef<HTMLDivElement>(null)
  const inner = textStrength ?? strength * 0.5

  const reset = () => {
    const el = node.current
    if (!el) return
    el.style.transform = 'translate3d(0, 0, 0)'
    el.querySelectorAll<HTMLElement>('[data-magnetic-inner]').forEach((child) => {
      child.style.transform = 'translate3d(0, 0, 0)'
    })
  }

  return (
    <div
      ref={node}
      className={className}
      onMouseMove={(event) => {
        const el = node.current
        if (!el) return
        if (
          window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)')
            .matches
        ) {
          return
        }
        const rect = el.getBoundingClientRect()
        const x = event.clientX - (rect.left + rect.width / 2)
        const y = event.clientY - (rect.top + rect.height / 2)
        el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`
        el.querySelectorAll<HTMLElement>('[data-magnetic-inner]').forEach((child) => {
          child.style.transform = `translate3d(${x * inner}px, ${y * inner}px, 0)`
        })
      }}
      onMouseLeave={reset}
    >
      {children}
    </div>
  )
}
