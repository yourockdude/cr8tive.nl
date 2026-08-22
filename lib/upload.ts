import { Buffer } from 'node:buffer'
import { UPLOAD_PATH, slugify } from '@/lib/content'
import type { FileWrite } from '@/lib/github'

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

export type PreparedUpload = { url: string; write: FileWrite }

/**
 * Returns the write instead of performing it, so an edit that also replaces
 * an image lands as a single commit alongside the JSON.
 */
export async function prepareUpload(
  file: File,
  prefix: string,
): Promise<PreparedUpload | null> {
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
  return {
    url: `/media/${name}`,
    write: {
      path: `${UPLOAD_PATH}/${name}`,
      content: Buffer.from(await file.arrayBuffer()),
    },
  }
}
