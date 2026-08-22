import type { Metadata } from 'next'
import { Schibsted_Grotesk } from 'next/font/google'
import { SITE_URL } from '@/lib/types'
import './globals.css'

const grotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Yuri Yurchenko — Design Engineer',
    template: '%s — Yuri Yurchenko',
  },
  description:
    'Freelance design engineer. Product interfaces, design systems, and production frontend.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body>{children}</body>
    </html>
  )
}
