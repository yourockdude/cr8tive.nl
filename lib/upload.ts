import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { slugify } from '@/lib/content'

const types: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

function fileType(file: File) {
  if (Object.values(types).includes(file.type)) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return types[ext] ?? ''
}

export async function saveUpload(file: File, prefix: string) {
  if (!file.size) return null
  const type = fileType(file)
  if (!type) {
    throw new Error('Можно загрузить JPG, PNG, WEBP или GIF')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Файл больше 8 МБ')
  }

  const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1]
  const name = `${slugify(prefix)}-${Date.now()}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${name}`
}
