'use client'

import { useEffect, useRef } from 'react'
import { useSite } from '@/components/site-context'

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const { hovering } = useSite()
  const hoveringRef = useRef(hovering)

  useEffect(() => {
    hoveringRef.current = hovering
  }, [hovering])

  useEffect(() => {
    const el = dot.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) {
      el.style.display = 'none'
      return
    }

    document.documentElement.classList.add('has-cursor')

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let frame = 0

    const onMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
    }

    const tick = () => {
      cx += (x - cx) * 0.18
      cy += (y - cy) * 0.18
      const view = hoveringRef.current === 'view'
      const link = hoveringRef.current === 'link'
      const scale = view ? 1 : link ? 0.55 : 0.12
      el.style.transform = `translate(${cx}px, ${cy}px) scale(${scale})`
      el.dataset.state = hoveringRef.current ?? 'default'
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="cursor" ref={dot} aria-hidden>
      <span>View</span>
    </div>
  )
}
