'use client'

import type { ReactNode } from 'react'
import { Cursor } from '@/components/Cursor'
import { Header } from '@/components/Header'
import { Menu } from '@/components/Menu'
import { Preloader } from '@/components/Preloader'
import { SiteProvider } from '@/components/site-context'
import type { SiteContent } from '@/lib/types'

export function Site({
  children,
  content,
}: {
  children: ReactNode
  content: SiteContent
}) {
  return (
    <SiteProvider>
      <Preloader />
      <Cursor />
      <Header content={content} />
      <Menu content={content} />
      {children}
    </SiteProvider>
  )
}
