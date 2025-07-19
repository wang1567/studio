
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
  },
  async rewrites() {
    return [
      {
        source: '/stream',
        // This proxies requests from the browser to the stream-server running on the SAME cloud machine.
        destination: 'http://localhost:8082/stream',
      },
    ]
  },
  allowedDevOrigins: [
    '6000-firebase-studio-1750221808565.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
