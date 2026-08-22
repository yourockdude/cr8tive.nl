'use client'

import Link from 'next/link'
import { Globe } from '@/components/Globe'
import { useSite } from '@/components/site-context'
import type { SiteContent } from '@/lib/types'

const links = [
  { href: '/', label: 'Home' },
  { href: '/#work', label: 'Work' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export function Menu({ content }: { content: SiteContent }) {
  const { menu, setMenu, setHovering } = useSite()

  return (
    <div className={`menu${menu ? ' is-open' : ''}`} aria-hidden={!menu}>
      <div className={`menu-shell${menu ? ' is-open' : ''}`}>
        <div className="menu-panel">
          <button
            className="menu-close"
            onClick={() => setMenu(false)}
            onMouseEnter={() => setHovering('link')}
            onMouseLeave={() => setHovering(null)}
          >
            Close
          </button>
          <div className="menu-grid">
            <nav aria-label="Menu">
              <p className="tiny">Navigation</p>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenu(false)}
                  onMouseEnter={() => setHovering('link')}
                  onMouseLeave={() => setHovering(null)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div>
              <p className="tiny">Socials</p>
              <a href={content.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href={content.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={content.readcv} target="_blank" rel="noreferrer">
                Read.cv
              </a>
            </div>
          </div>
          <div className="location-pill menu-location">
            <span>
              {content.locationLine1}
              <br />
              {content.locationLine2}
            </span>
            <span className="globe-wrap">
              <Globe />
            </span>
          </div>
        </div>
        <svg className="menu-curve" viewBox="0 0 1200 140" preserveAspectRatio="none">
          <path d="M0 0 H1200 V70 Q600 140 0 70 Z" />
        </svg>
      </div>
    </div>
  )
}
