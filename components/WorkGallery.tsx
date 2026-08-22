'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useSite } from '@/components/site-context'
import type { Project } from '@/lib/types'

export function WorkGallery({
  projects,
  open,
  onClose,
}: {
  projects: Project[]
  open: boolean
  onClose: () => void
}) {
  const { setHovering } = useSite()
  const panel = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    restoreFocus.current = document.activeElement as HTMLElement | null
    // Focus the panel rather than the close button: a programmatic focus on
    // the button trips :focus-visible and draws a ring outside its border.
    panel.current?.focus()

    // The page behind must not scroll while the overlay owns the viewport.
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      setHovering(null)
      restoreFocus.current?.focus()
    }
  }, [open, onClose, setHovering])

  return (
    <div
      className={`gallery${open ? ' is-open' : ''}`}
      aria-hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="gallery-panel"
        ref={panel}
        role="dialog"
        aria-modal={open}
        aria-label="All work"
        tabIndex={-1}
      >
        <div className="gallery-bar">
          <p className="tiny">
            All work <sup>{String(projects.length).padStart(2, '0')}</sup>
          </p>
          <button
            className="gallery-close"
            type="button"
            onClick={onClose}
            onMouseEnter={() => setHovering('button')}
            onMouseLeave={() => setHovering(null)}
            aria-label="Close gallery"
          >
            <span aria-hidden>Close</span>
          </button>
        </div>

        <div className="gallery-grid">
          {projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/work/${project.id}`}
              className="gallery-tile"
              style={{ '--i': index } as React.CSSProperties}
              tabIndex={open ? 0 : -1}
              onClick={onClose}
              onMouseEnter={() => setHovering('view')}
              onMouseLeave={() => setHovering(null)}
            >
              <span className="gallery-frame" style={{ background: project.frame }}>
                <Image
                  src={project.image}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 30vw"
                />
                <span className="gallery-number">{project.number}</span>
              </span>
              <span className="gallery-meta">
                <strong>{project.name}</strong>
                <span>
                  {project.label}
                  <em>{project.year}</em>
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="gallery-foot">
          <Link href="/work" className="gallery-link" tabIndex={open ? 0 : -1}>
            Open the full archive →
          </Link>
        </div>
      </div>
    </div>
  )
}
