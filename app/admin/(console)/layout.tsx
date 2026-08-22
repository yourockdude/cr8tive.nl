import Link from 'next/link'
import { logoutAction } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const email = await requireAdmin()

  return (
    <>
      <header className="admin-bar">
        <strong>Studio admin</strong>
        <nav className="admin-nav">
          <Link href="/admin">Обзор</Link>
          <Link href="/admin/texts">Тексты</Link>
          <Link href="/admin/projects">Проекты</Link>
          <Link href="/" target="_blank" rel="noreferrer">
            Сайт ↗
          </Link>
        </nav>
        <form action={logoutAction}>
          <button className="admin-btn ghost" type="submit">
            {email} · Выйти
          </button>
        </form>
      </header>
      <div className="admin-main">{children}</div>
    </>
  )
}
