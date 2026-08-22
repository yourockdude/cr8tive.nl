import { readUpload } from '@/lib/content'

const types: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

/**
 * Uploads live in the repository rather than `public/`, because a file
 * committed after the last deploy would not be in the build output. Names
 * carry a timestamp and are never rewritten, so the response can be immutable.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const file = await readUpload(name)
  if (!file) return new Response('Not found', { status: 404 })

  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': types[ext] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
