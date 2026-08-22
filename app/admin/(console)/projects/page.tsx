import Image from 'next/image'
import Link from 'next/link'
import { ProjectControls } from '@/app/admin/(console)/projects/project-controls'
import { readProjects } from '@/lib/content'

export default async function ProjectsPage() {
  const projects = await readProjects()

  return (
    <>
      <p className="tiny">Portfolio</p>
      <h1>Проекты</h1>
      <p className="admin-lead">
        Порядок списка = порядок на сайте. Первые два — featured.
      </p>
      <p>
        <Link className="admin-btn" href="/admin/projects/new">
          Новый проект
        </Link>
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th> </th>
            <th>Проект</th>
            <th>Год</th>
            <th> </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr key={project.id}>
              <td>
                <Image
                  src={project.image}
                  alt=""
                  width={64}
                  height={80}
                  className="admin-thumb"
                />
              </td>
              <td>
                <Link href={`/admin/projects/${project.id}`}>
                  {project.number} {project.name}
                </Link>
                <div className="tiny">{project.label}</div>
              </td>
              <td>{project.year}</td>
              <td>
                <ProjectControls
                  id={project.id}
                  name={project.name}
                  isFirst={index === 0}
                  isLast={index === projects.length - 1}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
