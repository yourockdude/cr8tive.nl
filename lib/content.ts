import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Project, SiteContent } from '@/lib/types'

const contentDir = path.join(process.cwd(), 'content')
const siteFile = path.join(contentDir, 'site.json')
const projectsFile = path.join(contentDir, 'projects.json')

function numberProjects(projects: Project[]) {
  return projects.map((project, index) => ({
    ...project,
    number: String(index + 1).padStart(2, '0'),
  }))
}

export async function readSite(): Promise<SiteContent> {
  const raw = await readFile(siteFile, 'utf8')
  return JSON.parse(raw) as SiteContent
}

export async function writeSite(site: SiteContent) {
  await mkdir(contentDir, { recursive: true })
  await writeFile(siteFile, `${JSON.stringify(site, null, 2)}\n`)
}

export async function readProjects(): Promise<Project[]> {
  const raw = await readFile(projectsFile, 'utf8')
  return JSON.parse(raw) as Project[]
}

export async function writeProjects(projects: Project[]) {
  await mkdir(contentDir, { recursive: true })
  await writeFile(projectsFile, `${JSON.stringify(numberProjects(projects), null, 2)}\n`)
}

export async function getProject(slug: string) {
  const projects = await readProjects()
  return projects.find((project) => project.id === slug)
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || `project-${Date.now()}`
}
