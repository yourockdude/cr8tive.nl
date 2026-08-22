'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useSite } from '@/components/site-context'
import type { Project } from '@/lib/types'

export function WorkList({ projects }: { projects: Project[] }) {
  const { setHovering } = useSite()
  const [active, setActive] = useState<string | null>(null)
  const preview = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0, r: 0, cr: 0, raf: 0 })

  const current = projects.find((project) => project.id === active)

  const startLoop = () => {
    const el = preview.current
    if (!el) return
    cancelAnimationFrame(pos.current.raf)
    const tick = () => {
      pos.current.cx += (pos.current.x - pos.current.cx) * 0.14
      pos.current.cy += (pos.current.y - pos.current.cy) * 0.14
      pos.current.cr += (pos.current.r - pos.current.cr) * 0.12
      el.style.transform = `translate(${pos.current.cx}px, ${pos.current.cy}px) rotate(${pos.current.cr}deg)`
      pos.current.raf = requestAnimationFrame(tick)
    }
    pos.current.raf = requestAnimationFrame(tick)
  }

  return (
    <section
      className="work-index"
      onMouseMove={(event) => {
        const dx = event.clientX - pos.current.x
        pos.current.x = event.clientX
        pos.current.y = event.clientY
        pos.current.r = Math.max(-12, Math.min(12, dx * 0.35))
      }}
      onMouseEnter={() => {
        if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) {
          return
        }
        startLoop()
      }}
      onMouseLeave={() => {
        setActive(null)
        setHovering(null)
        cancelAnimationFrame(pos.current.raf)
      }}
    >
      <p className="tiny">Recent work</p>
      <div className={`work-list${active ? ' is-hot' : ''}`}>
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/work/${project.id}`}
            className={`work-row${active === project.id ? ' is-on' : ''}`}
            onMouseEnter={() => {
              setActive(project.id)
              setHovering('view')
            }}
          >
            <strong>{project.name}</strong>
            <span>
              {project.label}
              <em>{project.year}</em>
            </span>
          </Link>
        ))}
      </div>
      <div
        className={`work-preview${current ? ' is-on' : ''}`}
        ref={preview}
        aria-hidden
      >
        {current ? <Image src={current.image} alt="" fill sizes="280px" /> : null}
      </div>
      <div className="more-wrap">
        <Link
          href="/#work"
          className="pill"
          onMouseEnter={() => setHovering('link')}
          onMouseLeave={() => setHovering(null)}
        >
          More work <sup>{String(projects.length).padStart(2, '0')}</sup>
        </Link>
      </div>
    </section>
  )
}
