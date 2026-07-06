import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '13.125.161.66',
      },
    ],
  },
}
export default nextConfig