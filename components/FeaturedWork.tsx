'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSite } from '@/components/site-context'
import type { Project } from '@/lib/types'

export function FeaturedWork({ projects }: { projects: Project[] }) {
  const { setHovering } = useSite()
  const featured = projects.slice(0, 2)

  return (
    <section className="featured" id="work">
      {featured.map((project) => (
        <Link
          key={project.id}
          href={`/work/${project.id}`}
          className="featured-card"
          onMouseEnter={() => setHovering('view')}
          onMouseLeave={() => setHovering(null)}
        >
          <div className="featured-frame" style={{ background: project.frame }}>
            <Image
              src={project.image}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
            />
          </div>
          <div className="featured-meta">
            <h3>{project.name}</h3>
            <div>
              <span>{project.label}</span>
              <span>{project.year}</span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}
