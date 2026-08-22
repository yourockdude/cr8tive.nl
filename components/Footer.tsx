'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Action } from '@/components/Action'
import { useSite } from '@/components/site-context'
import { resolveTimezone, timezoneCity } from '@/lib/time'
import type { SiteContent } from '@/lib/types'

export function Footer({ content }: { content: SiteContent }) {
  const { setHovering } = useSite()
  const [time, setTime] = useState('')
  const title = content.footerTitle.split('\n')
  const timezone = resolveTimezone(content.timezone)

  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short',
    })
    const tick = () => setTime(format.format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [timezone])

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
          {title.map((line, index) => (
            <span key={index}>
              {line}
              <br />
            </span>
          ))}
        </h2>
      </div>
      <Action shape="round" href={`mailto:${content.email}`} wrapClassName="contact-magnet">
        {content.footerCta}
      </Action>
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
          <span suppressHydrationWarning>{time || timezoneCity(timezone)}</span>
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
