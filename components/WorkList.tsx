'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Action } from '@/components/Action'
import { Magnetic } from '@/components/Magnetic'
import { WorkGallery } from '@/components/WorkGallery'
import { useSite } from '@/components/site-context'
import type { Project } from '@/lib/types'

const HOME_ROWS = 4

export function WorkList({ projects }: { projects: Project[] }) {
  const { setHovering } = useSite()
  const [active, setActive] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [gallery, setGallery] = useState(false)
  const preview = useRef<HTMLDivElement>(null)
  const listBox = useRef<HTMLDivElement>(null)

  // Frames stack inside the card: the newest slides up from below while the one
  // it replaces slides out of the top, so the swap reads as a single movement.
  const [frames, setFrames] = useState<{ key: number; src: string }[]>([])
  const frameNodes = useRef(new Map<number, HTMLSpanElement>())
  const frameKey = useRef(0)
  const shownId = useRef<string | null>(null)
  const animatedKey = useRef(0)
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0, r: 0, cr: 0, raf: 0 })

  // Labels read "Design & Development", so each project belongs to several
  // categories at once.
  const categories = useMemo(() => {
    const seen: string[] = []
    for (const project of projects) {
      for (const part of project.label.split('&')) {
        const value = part.trim()
        if (value && !seen.includes(value)) seen.push(value)
      }
    }
    return seen
  }, [projects])

  // Unfiltered the list stays short and the gallery holds the rest; once a
  // category is chosen, every match is worth showing.
  const shown = useMemo(() => {
    if (!filter) return projects.slice(0, HOME_ROWS)
    return projects.filter((project) => project.label.includes(filter))
  }, [projects, filter])

  const visible = new Set(shown.map((project) => project.id))
  const current = shown.find((project) => project.id === active)

  // Half the preview card, so clamping keeps it fully inside the rows block.
  const HALF_W = 200
  const HALF_H = 118

  const clamp = (value: number, min: number, max: number) =>
    min > max ? (min + max) / 2 : Math.min(Math.max(value, min), max)

  useEffect(() => {
    gsap.ticker.fps(60)
  }, [])

  // Queue a frame whenever the pointer moves to a different project.
  useEffect(() => {
    if (!current) {
      shownId.current = null
      return
    }
    if (current.id === shownId.current) return
    shownId.current = current.id
    frameKey.current += 1
    const key = frameKey.current
    const src = current.preview ?? current.image
    setFrames((prev) => [...prev.slice(-1), { key, src }])
  }, [current])

  useEffect(() => {
    const top = frames[frames.length - 1]
    // Trimming the stack re-runs this effect; without the guard the incoming
    // frame would be animated in a second time.
    if (!top || top.key === animatedKey.current) return
    animatedKey.current = top.key

    const topEl = frameNodes.current.get(top.key)
    if (!topEl) return
    const below = frames.length > 1 ? frames[frames.length - 2] : null
    const belowEl = below ? frameNodes.current.get(below.key) : null
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.4
    const trim = () => setFrames((prev) => prev.filter((frame) => frame.key === top.key))

    gsap.fromTo(
      topEl,
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration, ease: 'power3.out', overwrite: 'auto' },
    )

    if (belowEl) {
      gsap.to(belowEl, {
        yPercent: -100,
        opacity: 0,
        duration,
        ease: 'power3.out',
        overwrite: 'auto',
        onComplete: trim,
      })
    } else if (frames.length > 1) {
      trim()
    }
  }, [frames])

  const startLoop = () => {
    const el = preview.current
    if (!el) return
    cancelAnimationFrame(pos.current.raf)
    const tick = () => {
      // The card tracks the cursor but never leaves the band occupied by the
      // project rows, so it cannot drift over the filters or the pill below.
      const bounds = listBox.current?.getBoundingClientRect()
      const targetX = bounds
        ? clamp(pos.current.x, bounds.left + HALF_W, bounds.right - HALF_W)
        : pos.current.x
      const targetY = bounds
        ? clamp(pos.current.y, bounds.top + HALF_H, bounds.bottom - HALF_H)
        : pos.current.y

      pos.current.cx += (targetX - pos.current.cx) * 0.14
      pos.current.cy += (targetY - pos.current.cy) * 0.14
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

      <div className="work-filters" role="group" aria-label="Filter work by discipline">
        {[null, ...categories].map((value) => (
          <Magnetic key={value ?? 'all'} className="magnet-wrap" strength={0.2}>
            <button
              type="button"
              className={`work-filter${filter === value ? ' is-on' : ''}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              onMouseEnter={() => setHovering('button')}
              onMouseLeave={() => setHovering(null)}
            >
              <span data-magnetic-inner>{value ?? 'All'}</span>
            </button>
          </Magnetic>
        ))}
      </div>

      <div className={`work-list${active ? ' is-hot' : ''}`} ref={listBox}>
        {projects.map((project) => {
          const off = !visible.has(project.id)
          return (
            <Link
              key={project.id}
              href={`/work/${project.id}`}
              className={`work-row${active === project.id ? ' is-on' : ''}${off ? ' is-off' : ''}`}
              aria-hidden={off}
              tabIndex={off ? -1 : undefined}
              onMouseEnter={() => {
                if (off) return
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
          )
        })}
      </div>

      <div className={`work-preview${current ? ' is-on' : ''}`} ref={preview} aria-hidden>
        <span className="work-preview-media">
          {frames.map((frame) => (
            <span
              className="work-preview-frame"
              key={frame.key}
              ref={(node) => {
                if (node) frameNodes.current.set(frame.key, node)
                else frameNodes.current.delete(frame.key)
              }}
            >
              <Image src={frame.src} alt="" fill sizes="400px" />
            </span>
          ))}
        </span>
      </div>

      <div className="more-wrap">
        <Action
          shape="pill"
          onClick={() => setGallery(true)}
          suffix={<sup>{String(projects.length).padStart(2, '0')}</sup>}
        >
          More work
        </Action>
      </div>

      <WorkGallery projects={projects} open={gallery} onClose={() => setGallery(false)} />
    </section>
  )
}
