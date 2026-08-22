import type { NextConfig } from 'next'

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
    }

export default nextConfig
