import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject, readProjects } from '@/lib/content'

type CasePageProps = {
  params: Promise<{ slug: string }>
}

// The static export rejects `true` outright, and with no server there is
// nothing to render an unknown slug anyway. Flip this back if the site ever
// moves to a Node host, so a case study added through the admin resolves
// without a redeploy. The value has to be a literal — the option is parsed
// from the source, not evaluated.
export const dynamicParams = false

export async function generateStaticParams() {
  const projects = await readProjects()
  return projects.map((project) => ({ slug: project.id }))
}

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return {}
  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: `/work/${project.id}` },
    openGraph: {
      type: 'article',
      title: project.name,
      description: project.summary,
      url: `/work/${project.id}`,
      images: [{ url: project.image, alt: `${project.name} preview` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.name,
      description: project.summary,
      images: [project.image],
    },
  }
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params
  const [project, projects] = await Promise.all([getProject(slug), readProjects()])
  if (!project) notFound()

  const index = projects.findIndex((item) => item.id === project.id)
  const previous = projects[(index - 1 + projects.length) % projects.length]
  const next = projects[(index + 1) % projects.length]

  return (
    <article className="case">
      <div className="case-top">
        <Link className="back" href="/#work">
          ← All work
        </Link>
        <span className="tiny">
          {project.number} / {String(projects.length).padStart(2, '0')} · {project.year}
        </span>
      </div>
      <p className="tiny">
        {project.category} · {project.role}
      </p>
      <h1>{project.name}</h1>
      <p className="case-lede">{project.summary}</p>
      <div className="case-hero" style={{ background: project.frame }}>
        <Image
          src={project.image}
          alt={`${project.name} preview`}
          fill
          sizes="100vw"
        />
      </div>
      <div className="case-grid">
        <div>
          <h2>Problem</h2>
          <p>{project.problem}</p>
        </div>
        <div>
          <h2>Approach</h2>
          <p>{project.approach}</p>
        </div>
        <div>
          <h2>Outcome</h2>
          <p>{project.outcome}</p>
        </div>
        <div>
          <h2>Stack</h2>
          <div className="stack">
            {project.stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
      <nav className="case-nav" aria-label="Adjacent case studies">
        <Link href={`/work/${previous.id}`}>← {previous.name}</Link>
        <Link href={`/work/${next.id}`}>{next.name} →</Link>
      </nav>
    </article>
  )
}
