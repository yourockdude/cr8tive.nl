import { existsSync } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const stash = path.join(root, '.pages-stash')
const adminSrc = path.join(root, 'app', 'admin')
const proxySrc = path.join(root, 'proxy.ts')
const adminDst = path.join(stash, 'admin')
const proxyDst = path.join(stash, 'proxy.ts')
const nextBin = path.join(root, 'node_modules', '.bin', 'next')

async function moveIfExists(from, to) {
  if (!existsSync(from)) return
  await mkdir(path.dirname(to), { recursive: true })
  await rename(from, to)
}

async function stashServerRoutes() {
  await rm(stash, { recursive: true, force: true })
  await mkdir(stash, { recursive: true })
  await moveIfExists(adminSrc, adminDst)
  await moveIfExists(proxySrc, proxyDst)
}

async function restoreServerRoutes() {
  await moveIfExists(adminDst, adminSrc)
  await moveIfExists(proxyDst, proxySrc)
  await rm(stash, { recursive: true, force: true })
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
  await stashServerRoutes()
  await runBuild()
} finally {
  await restoreServerRoutes()
}
