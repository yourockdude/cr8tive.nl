import { redirect } from 'next/navigation'
import { LoginForm } from '@/app/admin/login/login-form'
import { getSessionEmail } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await getSessionEmail()) redirect('/admin')

  return (
    <div className="admin-login">
      <div>
        <p className="tiny">Studio</p>
        <h1>Вход в админку</h1>
        <p className="admin-lead">Email и пароль из .env.local</p>
        <LoginForm />
      </div>
    </div>
  )
}
