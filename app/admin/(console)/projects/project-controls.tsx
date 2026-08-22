'use client'

import { deleteProjectAction, moveProjectAction } from '@/app/admin/actions'

export function ProjectControls({
  id,
  name,
  isFirst,
  isLast,
}: {
  id: string
  name: string
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="admin-actions">
      <form action={moveProjectAction.bind(null, id, 'up')}>
        <button className="admin-btn ghost" type="submit" disabled={isFirst}>
          ↑
        </button>
      </form>
      <form action={moveProjectAction.bind(null, id, 'down')}>
        <button className="admin-btn ghost" type="submit" disabled={isLast}>
          ↓
        </button>
      </form>
      <form
        action={async () => {
          if (window.confirm(`Удалить ${name}?`)) {
            await deleteProjectAction(id)
          }
        }}
      >
        <button className="admin-btn danger" type="submit">
          Удалить
        </button>
      </form>
    </div>
  )
}
