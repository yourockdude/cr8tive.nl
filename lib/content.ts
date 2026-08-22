import { Buffer } from 'node:buffer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import projectsFallback from '@/content/projects.json'
import siteFallback from '@/content/site.json'
import {
  commitFiles,
  readRepoFile,
  repoConfig,
  type FileWrite,
} from '@/lib/github'
import { resolveTimezone } from '@/lib/time'
import type { Project, SiteContent } from '@/lib/types'

export const SITE_PATH = 'content/site.json'
export const PROJECTS_PATH = 'content/projects.json'
export const UPLOAD_PATH = 'content/uploads'

export function normalizeLines(value: string) {
  return value.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
}

function normalizeSite(site: SiteContent): SiteContent {
  return {
    ...site,
    timezone: resolveTimezone(site.timezone),
    introTitle: normalizeLines(site.introTitle ?? ''),
    introBody: normalizeLines(site.introBody ?? ''),
    footerTitle: normalizeLines(site.footerTitle ?? ''),
    metaDescription: normalizeLines(site.metaDescription ?? ''),
  }
}

function numberProjects(projects: Project[]) {
  return projects.map((project, index) => ({
    ...project,
    number: String(index + 1).padStart(2, '0'),
  }))
}

/**
 * Content lives in the repository, so the deployed bundle already carries a
 * copy of it. Serving that copy beats a 500 when the token is missing or
 * GitHub is down — the site goes stale, not dark.
 */
async function readJson<T>(repoPath: string, fallback: T): Promise<T> {
  const config = repoConfig()
  if (!config) return fallback
  try {
    const raw = await readRepoFile(config, repoPath)
    if (!raw) return fallback
    return JSON.parse(raw.toString('utf8')) as T
  } catch (error) {
    console.error(`Falling back to bundled ${repoPath}:`, error)
    return fallback
  }
}

export async function readSite(): Promise<SiteContent> {
  return normalizeSite(await readJson(SITE_PATH, siteFallback as SiteContent))
}

export async function readProjects(): Promise<Project[]> {
  return readJson(PROJECTS_PATH, projectsFallback as Project[])
}

export async function getProject(slug: string) {
  const projects = await readProjects()
  return projects.find((project) => project.id === slug)
}

export function siteWrite(site: SiteContent): FileWrite {
  return {
    path: SITE_PATH,
    content: Buffer.from(`${JSON.stringify(normalizeSite(site), null, 2)}\n`),
  }
}

export function projectsWrite(projects: Project[]): FileWrite {
  return {
    path: PROJECTS_PATH,
    content: Buffer.from(`${JSON.stringify(numberProjects(projects), null, 2)}\n`),
  }
}

/**
 * `[skip ci]` keeps a content edit from triggering a rebuild: the live site
 * picks the change up through the cache tag, so a deploy would only burn
 * minutes and republish identical output.
 */
export async function commitContent(writes: FileWrite[], message: string) {
  if (!writes.length) return
  const config = repoConfig()
  if (config) {
    await commitFiles(config, writes, `${message} [skip ci]`)
    return
  }
  await Promise.all(
    writes.map(async (write) => {
      const target = path.join(process.cwd(), write.path)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, write.content)
    }),
  )
}

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*$/i

export async function readUpload(name: string): Promise<Buffer | null> {
  if (!SAFE_NAME.test(name) || name.includes('..')) return null
  const repoPath = `${UPLOAD_PATH}/${name}`
  const config = repoConfig()
  if (config) return readRepoFile(config, repoPath)
  try {
    return await readFile(path.join(process.cwd(), repoPath))
  } catch {
    return null
  }
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || `project-${Date.now()}`
}
