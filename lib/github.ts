import { Buffer } from 'node:buffer'

const API = 'https://api.github.com'

export const CONTENT_TAG = 'site-content'

export type RepoConfig = {
  owner: string
  repo: string
  branch: string
  token: string
}

export function repoConfig(): RepoConfig | null {
  const slug = process.env.GITHUB_REPO ?? ''
  const token = process.env.GITHUB_TOKEN ?? ''
  const [owner, repo] = slug.split('/')
  if (!owner || !repo || !token) return null
  return { owner, repo, branch: process.env.GITHUB_BRANCH || 'main', token }
}

function headers(config: RepoConfig, accept = 'application/vnd.github+json') {
  return {
    accept,
    authorization: `Bearer ${config.token}`,
    'x-github-api-version': '2022-11-28',
  }
}

async function api(config: RepoConfig, path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...headers(config), ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    throw new Error(
      `GitHub ${init?.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`,
    )
  }
  return response.json()
}

/**
 * Reads a file from the repository. Cached and tagged so a write can expire it
 * — without that every render would spend a round trip on the GitHub API.
 */
export async function readRepoFile(
  config: RepoConfig,
  path: string,
): Promise<Buffer | null> {
  const url = `${API}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`
  const response = await fetch(url, {
    cache: 'force-cache',
    next: { tags: [CONTENT_TAG] },
    headers: headers(config, 'application/vnd.github.raw'),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub read ${path} failed: ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

export type FileWrite = { path: string; content: Buffer }

/**
 * Commits every file in one go through the git data API. The contents API
 * would need a commit per file, so a project edit that also replaces the
 * cover would land as two commits and could half-apply.
 */
export async function commitFiles(
  config: RepoConfig,
  files: FileWrite[],
  message: string,
) {
  if (!files.length) return null
  const { owner, repo, branch } = config
  const base = `/repos/${owner}/${repo}`

  const ref = await api(config, `${base}/git/ref/heads/${branch}`)
  const headSha: string = ref.object.sha
  const headCommit = await api(config, `${base}/git/commits/${headSha}`)

  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await api(config, `${base}/git/blobs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: file.content.toString('base64'),
          encoding: 'base64',
        }),
      })
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha }
    }),
  )

  const tree = await api(config, `${base}/git/trees`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: blobs }),
  })

  const commit = await api(config, `${base}/git/commits`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  })

  // Fails rather than force-updating if something else moved the branch.
  await api(config, `${base}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return commit.sha as string
}
