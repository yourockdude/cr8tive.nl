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
          <span>{content.role}</span>
          {/* Drawn rather than the ↘ character, which Schibsted Grotesk does
              not carry and which falls back to a system glyph. The arrow sits
              after the label on desktop and above it on narrow screens, which
              column-reverse handles without reordering the markup. */}
          <svg className="hero-arrow" viewBox="0 0 28 28" aria-hidden>
            <path
              d="M7 7 21 21M21 11v10H11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            />
          </svg>
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
