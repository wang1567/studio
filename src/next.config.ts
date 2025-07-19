
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
  },
  // The rewrite rule is no longer needed with the new architecture.
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
       {
        protocol: 'https',
        hostname: '*.ngrok-free.app', // Allow images from ngrok's dynamic domain
      },
       {
        protocol: 'https',
        hostname: '*.ngrok.io', // More general rule for ngrok
      },
    ],
  },
};

export default nextConfig;
