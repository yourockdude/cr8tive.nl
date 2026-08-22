import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, rename, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const stash = path.join(root, '.pages-stash')
const nextBin = path.join(root, 'node_modules', '.bin', 'next')

// Everything that needs a server. The static export has no admin, no session
// proxy, and no route handler for uploads.
const moves = [
  [path.join(root, 'app', 'admin'), path.join(stash, 'admin')],
  [path.join(root, 'proxy.ts'), path.join(stash, 'proxy.ts')],
  [path.join(root, 'app', 'media'), path.join(stash, 'media')],
]

// Uploads normally stream out of the repository through /media/[name]. With no
// server to run that, copy them into public/ so the same URLs resolve as files.
const uploads = path.join(root, 'content', 'uploads')
const staticMedia = path.join(root, 'public', 'media')

async function moveIfExists(from, to) {
  if (!existsSync(from)) return
  await mkdir(path.dirname(to), { recursive: true })
  await rename(from, to)
}

async function before() {
  await rm(stash, { recursive: true, force: true })
  await mkdir(stash, { recursive: true })
  for (const [from, to] of moves) await moveIfExists(from, to)

  await rm(staticMedia, { recursive: true, force: true })
  if (existsSync(uploads)) {
    const files = await readdir(uploads)
    if (files.length) await cp(uploads, staticMedia, { recursive: true })
  }
}

async function after() {
  for (const [from, to] of moves) await moveIfExists(to, from)
  await rm(stash, { recursive: true, force: true })
  await rm(staticMedia, { recursive: true, force: true })
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(nextBin, ['build'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, GITHUB_PAGES: 'true' },
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve(undefined)
      else reject(new Error(`next build exited with ${code}`))
    })
  })
}

try {
  await before()
  await runBuild()
} finally {
  await after()
}
