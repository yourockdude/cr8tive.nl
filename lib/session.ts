import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/types'

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlToBytes(value: string) {
  const pad = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = pad + '='.repeat((4 - (pad.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) return null
  return secret
}

async function hmacKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

export async function signSession(email: string) {
  const secret = getSecret()
  if (!secret) throw new Error('AUTH_SECRET is not set')

  const payload = bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        email,
        exp: Date.now() + SESSION_MAX_AGE * 1000,
      }),
    ),
  )
  const key = await hmacKey(secret, 'sign')
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  )
  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`
}

export async function readSessionEmail(token: string | undefined) {
  const secret = getSecret()
  if (!secret || !token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const key = await hmacKey(secret, 'verify')
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(payload),
  )
  if (!valid) return null

  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      email?: string
      exp?: number
    }
    if (!data.email || typeof data.exp !== 'number' || data.exp < Date.now()) {
      return null
    }
    return data.email
  } catch {
    return null
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE }
