import type { MetadataRoute } from 'next'
import { readProjects } from '@/lib/content'
import { SITE_URL } from '@/lib/types'

// Required by the static export; on a server the tagged content fetch still
// lets `updateTag` regenerate this.
export const dynamic = 'force-static'

// The live site is a static export with `trailingSlash: true`, so every
// canonical URL ends in a slash.
function url(path: string) {
  return `${SITE_URL}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await readProjects()
  const lastModified = new Date()

  return [
    { url: url('/'), lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: url('/work/'), lastModified, changeFrequency: 'monthly', priority: 0.8 },
    ...projects.map((project) => ({
      url: url(`/work/${project.id}/`),
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ]
}
