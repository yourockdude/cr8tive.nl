import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="not-found">
      <p className="tiny">404</p>
      <h1>This page is missing.</h1>
      <p>
        <Link href="/">Return home →</Link>
      </p>
    </div>
  )
}
