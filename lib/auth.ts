import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  readSessionEmail,
  signSession,
} from '@/lib/session'

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

function same(left: string, right: string) {
  const a = digest(left)
  const b = digest(right)
  return timingSafeEqual(a, b)
}

export async function getSessionEmail() {
  const jar = await cookies()
  return readSessionEmail(jar.get(SESSION_COOKIE)?.value)
}

export async function requireAdmin() {
  const email = await getSessionEmail()
  if (!email) redirect('/admin/login')
  return email
}

export function credentialsConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET)
}

export function verifyCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? ''
  const expectedPassword = process.env.ADMIN_PASSWORD ?? ''
  if (!expectedEmail || !expectedPassword) return false
  return (
    same(email.trim().toLowerCase(), expectedEmail) &&
    same(password, expectedPassword)
  )
}

export async function createSession(email: string) {
  const token = await signSession(email.trim().toLowerCase())
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}
