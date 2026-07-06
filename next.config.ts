import type { NextConfig } from 'next'

const API_URL = 'http://13.125.161.66:8080'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '13.125.161.66',
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
    ]
  },
}
export default nextConfig
