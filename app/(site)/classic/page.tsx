import { FeaturedWork } from '@/components/FeaturedWork'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Intro } from '@/components/Intro'
import { WorkList } from '@/components/WorkList'
import { readProjects, readSite } from '@/lib/content'

// The published home page is the hand-built static page in `public/index.html`;
// this is the previous, content-driven one, kept reachable but out of search.
export const metadata = { robots: { index: false, follow: false } }

export default async function Home() {
  const [site, projects] = await Promise.all([readSite(), readProjects()])

  return (
    <div id="top">
      <main>
        <Hero content={site} />
        <Intro content={site} />
        <FeaturedWork projects={projects} />
        <WorkList projects={projects} />
      </main>
      <Footer content={site} />
    </div>
  )
}
