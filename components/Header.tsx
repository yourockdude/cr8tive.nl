'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Magnetic } from '@/components/Magnetic'
import { useSite } from '@/components/site-context'
import type { SiteContent } from '@/lib/types'

export function Header({ content }: { content: SiteContent }) {
  const { setMenu, setHovering } = useSite()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.55)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="site-header">
      <a className="skip" href="#work">
        Skip to work
      </a>
      <Link
        href="/"
        className="wordmark"
        onMouseEnter={() => setHovering('link')}
        onMouseLeave={() => setHovering(null)}
      >
        {content.wordmark}
      </Link>
      <nav className={`nav${scrolled ? ' is-hidden' : ''}`} aria-label="Primary">
        <Link href="/#work" onMouseEnter={() => setHovering('link')} onMouseLeave={() => setHovering(null)}>
          Work
        </Link>
        <Link href="/#about" onMouseEnter={() => setHovering('link')} onMouseLeave={() => setHovering(null)}>
          About
        </Link>
        <Link href="/#contact" onMouseEnter={() => setHovering('link')} onMouseLeave={() => setHovering(null)}>
          Contact
        </Link>
      </nav>
      <Magnetic className={`burger-wrap${scrolled ? ' is-on' : ''}`} strength={0.45}>
        <button
          className="burger"
          aria-label="Open menu"
          onMouseEnter={() => setHovering('link')}
          onMouseLeave={() => setHovering(null)}
          onClick={() => setMenu(true)}
        >
          <span />
          <span />
        </button>
      </Magnetic>
    </header>
  )
}
