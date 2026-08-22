import Image from 'next/image'
import { Globe } from '@/components/Globe'
import type { SiteContent } from '@/lib/types'

export function Hero({ content }: { content: SiteContent }) {
  return (
    <section className="hero">
      <div className="hero-photo">
        <Image
          src={content.portrait}
          alt={content.name}
          fill
          sizes="(max-width: 900px) 78vw, 440px"
          priority
        />
      </div>
      <div className="hero-aside hero-aside-left">
        <div className="location-pill">
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
      <div className="hero-aside hero-aside-right">
        <p className="hero-role">
          <span className="hero-arrow">↘</span>
          {content.role}
        </p>
      </div>
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index}>{content.name} —</span>
          ))}
        </div>
      </div>
      <h1 className="sr-only">
        {content.name}, {content.role}
      </h1>
    </section>
  )
}
