export const FALLBACK_TIMEZONE = 'Europe/Amsterdam'

export function isValidTimezone(value: string) {
  if (!value) return false
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function resolveTimezone(value: string | undefined) {
  return value && isValidTimezone(value) ? value : FALLBACK_TIMEZONE
}

export function timezoneCity(value: string) {
  const zone = resolveTimezone(value)
  const part = zone.split('/').pop() ?? zone
  return part.replaceAll('_', ' ')
}
