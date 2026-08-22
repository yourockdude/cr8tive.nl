'use client'

import Link from 'next/link'
import { Magnetic } from '@/components/Magnetic'
import { useSite } from '@/components/site-context'
import type { SiteContent } from '@/lib/types'

export function Intro({ content }: { content: SiteContent }) {
  const { setHovering } = useSite()

  return (
    <section className="intro" id="about">
      <h2>{content.introTitle}</h2>
      <div className="intro-side">
        <p>{content.introBody}</p>
        <Magnetic className="magnet-wrap" strength={0.28}>
          <Link
            href="#contact"
            className="round-btn"
            onMouseEnter={() => setHovering('link')}
            onMouseLeave={() => setHovering(null)}
          >
            {content.introCta}
          </Link>
        </Magnetic>
      </div>
    </section>
  )
}
