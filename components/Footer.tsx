'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Magnetic } from '@/components/Magnetic'
import { useSite } from '@/components/site-context'
import type { SiteContent } from '@/lib/types'

export function Footer({ content }: { content: SiteContent }) {
  const { setHovering } = useSite()
  const [time, setTime] = useState('')
  const title = content.footerTitle.split('\n')

  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    const tick = () => setTime(`${format.format(new Date())} MSK`)
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <footer className="contact" id="contact">
      <div className="contact-top">
        <Image
          src={content.portrait}
          alt=""
          width={80}
          height={80}
          className="contact-face"
        />
        <h2>
          {title.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </h2>
      </div>
      <Magnetic className="magnet-wrap contact-magnet" strength={0.28}>
        <a
          className="round-btn"
          href={`mailto:${content.email}`}
          onMouseEnter={() => setHovering('link')}
          onMouseLeave={() => setHovering(null)}
        >
          {content.footerCta}
        </a>
      </Magnetic>
      <div className="contact-links">
        <a
          href={`mailto:${content.email}`}
          onMouseEnter={() => setHovering('link')}
          onMouseLeave={() => setHovering(null)}
        >
          {content.email}
        </a>
      </div>
      <div className="contact-foot">
        <div>
          <p className="tiny">Version</p>
          <span>{new Date().getFullYear()} © Edition</span>
        </div>
        <div>
          <p className="tiny">Local time</p>
          <span suppressHydrationWarning>{time || 'MSK'}</span>
        </div>
        <div>
          <p className="tiny">Socials</p>
          <div className="socials">
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
      </div>
    </footer>
  )
}
