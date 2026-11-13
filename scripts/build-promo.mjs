// The public site is the static promo page in promo/. GitHub Pages publishes
// out/, so the build is a copy plus the two files Pages itself needs.
// The previous Next.js portfolio build is still available as
// `npm run build:pages:portfolio`.
import { cp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const out = path.join(root, 'out')

await rm(out, { recursive: true, force: true })
await cp(path.join(root, 'promo'), out, { recursive: true })
await cp(path.join(root, 'public', 'CNAME'), path.join(out, 'CNAME'))
await writeFile(path.join(out, '.nojekyll'), '')

console.log('Promo site copied to out/')
