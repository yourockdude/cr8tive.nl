'use client'

import { Action } from '@/components/Action'
import type { SiteContent } from '@/lib/types'

export function Intro({ content }: { content: SiteContent }) {
  return (
    <section className="intro" id="about">
      <h2>{content.introTitle}</h2>
      <div className="intro-side">
        <p>{content.introBody}</p>
        <Action shape="round" href="#contact">
          {content.introCta}
        </Action>
      </div>
    </section>
  )
}
