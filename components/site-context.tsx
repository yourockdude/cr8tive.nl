'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type SiteContextValue = {
  menu: boolean
  setMenu: (value: boolean) => void
  hovering: 'link' | 'view' | null
  setHovering: (value: 'link' | 'view' | null) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false)
  const [hovering, setHovering] = useState<'link' | 'view' | null>(null)
  const value = useMemo(
    () => ({ menu, setMenu, hovering, setHovering }),
    [menu, hovering],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used within SiteProvider')
  return context
}
