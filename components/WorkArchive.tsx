'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSite } from '@/components/site-context'
import type { Project } from '@/lib/types'

export function WorkArchive({ projects }: { projects: Project[] }) {
  const { setHovering } = useSite()

  return (
    <section className="archive">
      <div className="archive-head">
        <p className="tiny">
          Archive — {String(projects.length).padStart(2, '0')}
        </p>
        <h1>Selected work</h1>
        <p className="archive-lede">Every case study, newest first.</p>
      </div>
      <div className="archive-grid">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/work/${project.id}`}
            className="archive-card"
            onMouseEnter={() => setHovering('view')}
            onMouseLeave={() => setHovering(null)}
          >
            <div className="archive-frame" style={{ background: project.frame }}>
              <Image
                src={project.image}
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 46vw"
              />
              <span className="archive-number">{project.number}</span>
            </div>
            <div className="archive-meta">
              <h2>{project.name}</h2>
              <div>
                <span>{project.label}</span>
                <span>{project.year}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
