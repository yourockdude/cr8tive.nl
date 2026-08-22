import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, readSessionEmail } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()

  const email = await readSessionEmail(request.cookies.get(SESSION_COOKIE)?.value)
  if (email) return NextResponse.next()

  const login = new URL('/admin/login', request.url)
  login.searchParams.set('from', pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
