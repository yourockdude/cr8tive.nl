const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

type Entry = { count: number; first: number }

/**
 * In-memory, so it is per instance and resets on a cold start. That is weaker
 * than a shared store, but it still turns an unattended brute force into a
 * slow one; a stronger guard needs Vercel KV or similar.
 */
const attempts = new Map<string, Entry>()

function prune(now: number) {
  for (const [key, entry] of attempts) {
    if (now - entry.first > WINDOW_MS) attempts.delete(key)
  }
}

export function tooManyAttempts(key: string) {
  const now = Date.now()
  prune(now)
  const entry = attempts.get(key)
  if (!entry) return false
  if (now - entry.first > WINDOW_MS) {
    attempts.delete(key)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

export function recordFailure(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now })
    return
  }
  entry.count += 1
}

export function clearAttempts(key: string) {
  attempts.delete(key)
}
