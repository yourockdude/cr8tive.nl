'use client'

import { useEffect, useState } from 'react'

const greetings = [
  'Hello',
  'Привет',
  'Bonjour',
  'Ciao',
  'Olá',
  'Hallå',
  'Guten tag',
  'Hallo',
]

export function Preloader() {
  const [hello, setHello] = useState(greetings[0])
  const [out, setOut] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let index = 0
    const step = window.setInterval(() => {
      index += 1
      if (index >= greetings.length) {
        window.clearInterval(step)
        window.setTimeout(() => setOut(true), 180)
        window.setTimeout(() => setGone(true), 1100)
        return
      }
      setHello(greetings[index])
    }, 140)

    return () => window.clearInterval(step)
  }, [])

  if (gone) return null

  return (
    <div className={`preloader${out ? ' is-out' : ''}`} aria-hidden>
      <p className="preloader-hello">
        <span className="preloader-dot" />
        {hello}
      </p>
      <svg
        className="preloader-curve"
        viewBox="0 0 1200 140"
        preserveAspectRatio="none"
      >
        <path d="M0 0 H1200 V70 Q600 140 0 70 Z" />
      </svg>
    </div>
  )
}
