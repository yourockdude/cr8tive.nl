'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  clearSession,
  createSession,
  credentialsConfigured,
  requireAdmin,
  verifyCredentials,
} from '@/lib/auth'
import {
  getProject,
  normalizeLines,
  readProjects,
  readSite,
  slugify,
  writeProjects,
  writeSite,
} from '@/lib/content'
import { clearAttempts, recordFailure, tooManyAttempts } from '@/lib/rate-limit'
import { isValidTimezone } from '@/lib/time'
import type { Project, SiteContent } from '@/lib/types'
import { saveUpload } from '@/lib/upload'

export type ActionState = { error?: string; ok?: boolean }

function field(form: FormData, key: string) {
  return normalizeLines(String(form.get(key) ?? '')).trim()
}

function revalidatePublic() {
  revalidatePath('/', 'layout')
  revalidatePath('/admin')
  revalidatePath('/work')
}

export async function loginAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!credentialsConfigured()) {
    return { error: 'Задайте ADMIN_EMAIL, ADMIN_PASSWORD и AUTH_SECRET в .env.local' }
  }
  const jar = await headers()
  const client = jar.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (tooManyAttempts(client)) {
    return { error: 'Слишком много попыток входа. Попробуйте через десять минут' }
  }

  const email = field(form, 'email')
  const password = field(form, 'password')
  if (!verifyCredentials(email, password)) {
    recordFailure(client)
    return { error: 'Неверный email или пароль' }
  }

  clearAttempts(client)
  await createSession(email)
  redirect('/admin')
}

export async function logoutAction() {
  await requireAdmin()
  await clearSession()
  redirect('/admin/login')
}

export async function saveTextsAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const current = await readSite()
  const portrait = form.get('portrait')
  let image = current.portrait
  try {
    if (portrait instanceof File && portrait.size) {
      const uploaded = await saveUpload(portrait, 'portrait')
      if (uploaded) image = uploaded
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Не удалось сохранить фото' }
  }

  const next: SiteContent = {
    name: field(form, 'name'),
    role: field(form, 'role'),
    wordmark: field(form, 'wordmark'),
    locationLine1: field(form, 'locationLine1'),
    locationLine2: field(form, 'locationLine2'),
    timezone: field(form, 'timezone'),
    introTitle: field(form, 'introTitle'),
    introBody: field(form, 'introBody'),
    introCta: field(form, 'introCta'),
    footerTitle: field(form, 'footerTitle'),
    footerCta: field(form, 'footerCta'),
    email: field(form, 'email'),
    linkedin: field(form, 'linkedin'),
    github: field(form, 'github'),
    readcv: field(form, 'readcv'),
    metaTitle: field(form, 'metaTitle'),
    metaDescription: field(form, 'metaDescription'),
    portrait: image,
  }

  if (!next.name || !next.email) {
    return { error: 'Имя и email обязательны' }
  }

  if (next.timezone && !isValidTimezone(next.timezone)) {
    return { error: 'Часовой пояс должен быть именем IANA, например Europe/Amsterdam' }
  }

  await writeSite(next)
  revalidatePublic()
  return { ok: true }
}

function projectFromForm(form: FormData, current?: Project): Omit<Project, 'number'> {
  const name = field(form, 'name')
  const requestedId = field(form, 'id') || slugify(name)
  return {
    id: current?.id ?? requestedId,
    name,
    year: field(form, 'year'),
    role: field(form, 'role'),
    label: field(form, 'label'),
    category: field(form, 'category'),
    summary: field(form, 'summary'),
    problem: field(form, 'problem'),
    approach: field(form, 'approach'),
    outcome: field(form, 'outcome'),
    stack: field(form, 'stack')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    accent: field(form, 'accent') || '#1c1d20',
    frame: field(form, 'frame') || '#ececec',
    image: current?.image ?? '',
  }
}

export async function createProjectAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const projects = await readProjects()
  const draft = projectFromForm(form)
  if (!draft.name) return { error: 'Название обязательно' }
  if (projects.some((project) => project.id === draft.id)) {
    return { error: 'Проект с таким id уже есть' }
  }

  try {
    const file = form.get('image')
    if (file instanceof File && file.size) {
      const uploaded = await saveUpload(file, draft.id)
      if (uploaded) draft.image = uploaded
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Не удалось загрузить изображение' }
  }

  if (!draft.image) return { error: 'Добавьте обложку проекта' }

  await writeProjects([...projects, { ...draft, number: '' }])
  revalidatePublic()
  redirect('/admin/projects')
}

export async function updateProjectAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const id = field(form, 'id')
  const current = await getProject(id)
  if (!current) return { error: 'Проект не найден' }

  const draft = projectFromForm(form, current)
  try {
    const file = form.get('image')
    if (file instanceof File && file.size) {
      const uploaded = await saveUpload(file, draft.id)
      if (uploaded) draft.image = uploaded
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Не удалось загрузить изображение' }
  }

  const projects = await readProjects()
  await writeProjects(
    projects.map((project) =>
      project.id === id ? { ...draft, number: project.number } : project,
    ),
  )
  revalidatePublic()
  return { ok: true }
}

export async function deleteProjectAction(id: string) {
  await requireAdmin()
  const projects = await readProjects()
  await writeProjects(projects.filter((project) => project.id !== id))
  revalidatePublic()
  redirect('/admin/projects')
}

export async function moveProjectAction(id: string, direction: 'up' | 'down') {
  await requireAdmin()
  const projects = await readProjects()
  const index = projects.findIndex((project) => project.id === id)
  const next = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || next < 0 || next >= projects.length) return
  const copy = [...projects]
  ;[copy[index], copy[next]] = [copy[next], copy[index]]
  await writeProjects(copy)
  revalidatePublic()
}
