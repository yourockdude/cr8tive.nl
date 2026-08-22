import type { Metadata } from 'next'
import { Site } from '@/components/Site'
import { readSite } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const site = await readSite()
  return {
    title: {
      default: site.metaTitle,
      template: `%s — ${site.name}`,
    },
    description: site.metaDescription,
    alternates: { canonical: '/' },
  }
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const site = await readSite()
  return <Site content={site}>{children}</Site>
}
