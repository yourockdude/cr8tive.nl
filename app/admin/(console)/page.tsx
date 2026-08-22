import Link from 'next/link'
import { readProjects, readSite } from '@/lib/content'

export default async function AdminHome() {
  const [site, projects] = await Promise.all([readSite(), readProjects()])

  return (
    <>
      <p className="tiny">Dashboard</p>
      <h1>Контент сайта</h1>
      <p className="admin-lead">
        Тексты главной и кейсы портфолио. Первые два проекта в списке попадают в featured.
      </p>
      <div className="admin-grid">
        <Link className="admin-card" href="/admin/texts">
          <strong>Тексты</strong>
          <p>
            {site.name} · {site.role}
          </p>
        </Link>
        <Link className="admin-card" href="/admin/projects">
          <strong>Проекты</strong>
          <p>{projects.length} в портфолио</p>
        </Link>
      </div>
    </>
  )
}
