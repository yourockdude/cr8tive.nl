export type SiteContent = {
  name: string
  role: string
  wordmark: string
  locationLine1: string
  locationLine2: string
  introTitle: string
  introBody: string
  introCta: string
  footerTitle: string
  footerCta: string
  email: string
  linkedin: string
  github: string
  readcv: string
  metaTitle: string
  metaDescription: string
  portrait: string
}

export type Project = {
  id: string
  number: string
  name: string
  year: string
  role: string
  label: string
  category: string
  summary: string
  problem: string
  approach: string
  outcome: string
  stack: string[]
  accent: string
  frame: string
  image: string
}

export const SESSION_COOKIE = 'yy_admin'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14
