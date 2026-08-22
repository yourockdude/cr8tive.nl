import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { WorkArchive } from '@/components/WorkArchive'
import { readProjects, readSite } from '@/lib/content'

const description =
  'Case studies: product interfaces, design systems, and production frontend.'

export async function generateMetadata(
  _props: PageProps<'/work'>,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // Carry the site-wide generated OG image over; declaring `openGraph` here
  // would otherwise replace the one inherited from the layout segment.
  const images = (await parent).openGraph?.images ?? []

  return {
    title: 'Work',
    description,
    alternates: { canonical: '/work' },
    openGraph: {
      type: 'website',
      title: 'Work',
      description,
      url: '/work',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Work',
      description,
    },
  }
}

export default async function WorkIndexPage() {
  const [site, projects] = await Promise.all([readSite(), readProjects()])

  return (
    <div id="top">
      <main>
        <div className="archive-top">
          <Link className="back" href="/">
            ← Home
          </Link>
        </div>
        <WorkArchive projects={projects} />
      </main>
      <Footer content={site} />
    </div>
  )
}
