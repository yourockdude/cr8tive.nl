export function Globe() {
  return (
    <svg className="globe" viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="24" cy="24" rx="7" ry="15" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 24h30M11.5 16.5h25M11.5 31.5h25" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
