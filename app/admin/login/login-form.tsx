'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/admin/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {})

  return (
    <form className="admin-form" action={action}>
      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
        />
      </label>
      <label>
        Пароль
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? <p className="admin-error">{state.error}</p> : null}
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? 'Входим…' : 'Войти'}
      </button>
    </form>
  )
}
