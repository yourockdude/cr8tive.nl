'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Magnetic } from '@/components/Magnetic'
import { useSite } from '@/components/site-context'

type ActionProps = {
  children: ReactNode
  shape: 'round' | 'pill'
  href?: string
  onClick?: () => void
  strength?: number
  className?: string
  wrapClassName?: string
  suffix?: ReactNode
  label?: string
}

/**
 * Shared button shell: a fill wipes up on hover while the label swaps for a
 * duplicate riding in from below. Two copies of the text keep the swap in the
 * flow, so the button never changes size mid-transition.
 */
export function Action({
  children,
  shape,
  href,
  onClick,
  strength = 0.28,
  className,
  wrapClassName,
  suffix,
  label,
}: ActionProps) {
  const { setHovering } = useSite()

  const body = (
    <>
      <span className="action-fill" aria-hidden />
      <span className="action-body" data-magnetic-inner>
        <span className="action-swap">
          <span className="action-line">{children}</span>
          <span className="action-line" aria-hidden>
            {children}
          </span>
        </span>
        {suffix}
      </span>
    </>
  )

  const classes = `action action-${shape}${className ? ` ${className}` : ''}`
  const hover = {
    onMouseEnter: () => setHovering('button'),
    onMouseLeave: () => setHovering(null),
  }

  const external = Boolean(href && !href.startsWith('/') && !href.startsWith('#'))

  return (
    <Magnetic
      className={`magnet-wrap${wrapClassName ? ` ${wrapClassName}` : ''}`}
      strength={strength}
    >
      {href && external ? (
        <a className={classes} href={href} {...hover}>
          {body}
        </a>
      ) : href ? (
        <Link className={classes} href={href} {...hover}>
          {body}
        </Link>
      ) : (
        <button className={classes} type="button" onClick={onClick} aria-label={label} {...hover}>
          {body}
        </button>
      )}
    </Magnetic>
  )
}
