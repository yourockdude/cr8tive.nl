'use client'

import { useRef, type ReactNode } from 'react'

export function Magnetic({
  children,
  strength = 0.38,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const node = useRef<HTMLDivElement>(null)

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
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
      }}
      onMouseLeave={() => {
        if (node.current) node.current.style.transform = 'translate(0, 0)'
      }}
    >
      {children}
    </div>
  )
}
