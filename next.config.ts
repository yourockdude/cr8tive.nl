import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  // lib/content.ts reads content/ from disk when no GitHub token is set, which
  // is a development-only path. The dynamic path makes Turbopack trace the
  // whole project into the server bundle, so keep the heavy folders out.
  outputFileTracingExcludes: {
    '/*': ['public/**/*', 'out/**/*', '.next/cache/**/*'],
  },
}

export default nextConfig
