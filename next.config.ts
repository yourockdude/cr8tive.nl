import type { NextConfig } from 'next'

// `npm run build:pages` sets this; the public site is a static export with no
// admin, while `npm run dev` keeps the admin and its server actions.
const githubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig: NextConfig = githubPages
  ? {
      output: 'export',
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      experimental: {
        serverActions: {
          bodySizeLimit: '8mb',
        },
      },
      // lib/content.ts reads content/ from disk when no GitHub token is set,
      // and the dynamic path makes Turbopack trace the whole project.
      outputFileTracingExcludes: {
        '/*': ['public/**/*', 'out/**/*', '.next/cache/**/*'],
      },
    }

export default nextConfig
