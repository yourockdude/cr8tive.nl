import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ProjectForm } from '@/app/admin/(console)/projects/project-form'
import { getProject } from '@/lib/content'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  return (
    <>
      <p className="tiny">{project.number}</p>
      <h1>{project.name}</h1>
      <p className="admin-lead">Карточка и страница кейса.</p>
      <Image
        src={project.image}
        alt=""
        width={120}
        height={150}
        className="admin-preview"
      />
      <ProjectForm project={project} />
    </>
  )
}
