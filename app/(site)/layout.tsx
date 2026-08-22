import type { Metadata } from 'next'
import { Site } from '@/components/Site'
import { readSite } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const site = await readSite()
  return {
    title: {
      // `absolute` so the root layout's template does not wrap it a second time.
      absolute: site.metaTitle,
      template: `%s — ${site.name}`,
    },
    description: site.metaDescription,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: site.metaTitle,
      description: site.metaDescription,
      url: '/',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: site.metaTitle,
      description: site.metaDescription,
    },
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
