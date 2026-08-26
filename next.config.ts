import type { NextConfig } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.idta.store'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.2.2'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.idta.store',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/ws-stomp/:path*',
        destination: `${API_URL}/ws-stomp/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: '/files/:path*',
        destination: `${API_URL}/files/:path*`,
      },
      {
        source: '/phone/:path*',
        destination: `${API_URL}/phone/:path*`,
      },
    ]
  },
}
export default nextConfig
