import { ProjectForm } from '@/app/admin/(console)/projects/project-form'

export default function NewProjectPage() {
  return (
    <>
      <p className="tiny">New</p>
      <h1>Новый проект</h1>
      <p className="admin-lead">Появится в конце списка. Поднимите стрелками, если нужен featured.</p>
      <ProjectForm />
    </>
  )
}
