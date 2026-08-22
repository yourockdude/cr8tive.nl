'use client'

import { useActionState } from 'react'
import { createProjectAction, updateProjectAction } from '@/app/admin/actions'
import type { Project } from '@/lib/types'

export function ProjectForm({ project }: { project?: Project }) {
  const action = project ? updateProjectAction : createProjectAction
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form className="admin-form" action={formAction}>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <div className="row">
        <label>
          Название
          <input name="name" defaultValue={project?.name} required />
        </label>
        <label>
          Год
          <input name="year" defaultValue={project?.year} required />
        </label>
      </div>
      {!project ? (
        <label>
          ID в URL (необязательно)
          <input name="id" placeholder="field" />
        </label>
      ) : null}
      <div className="row">
        <label>
          Подпись в списке
          <input name="label" defaultValue={project?.label ?? 'Design & Development'} />
        </label>
        <label>
          Категория
          <input name="category" defaultValue={project?.category} />
        </label>
      </div>
      <label>
        Роль
        <input name="role" defaultValue={project?.role} />
      </label>
      <label>
        Кратко
        <textarea name="summary" defaultValue={project?.summary} required />
      </label>
      <label>
        Problem
        <textarea name="problem" defaultValue={project?.problem} />
      </label>
      <label>
        Approach
        <textarea name="approach" defaultValue={project?.approach} />
      </label>
      <label>
        Outcome
        <textarea name="outcome" defaultValue={project?.outcome} />
      </label>
      <label>
        Стек через запятую
        <input name="stack" defaultValue={project?.stack.join(', ')} />
      </label>
      <div className="row">
        <label>
          Цвет рамки
          <input name="frame" defaultValue={project?.frame ?? '#ececec'} />
        </label>
        <label>
          Акцент
          <input name="accent" defaultValue={project?.accent ?? '#1c1d20'} />
        </label>
      </div>
      <label>
        Обложка
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={!project}
        />
      </label>
      {state.error ? <p className="admin-error">{state.error}</p> : null}
      {state.ok ? <p className="admin-ok">Сохранено</p> : null}
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? 'Сохраняем…' : project ? 'Сохранить проект' : 'Добавить проект'}
      </button>
    </form>
  )
}
