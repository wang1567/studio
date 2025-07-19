
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
  },
  async rewrites() {
    return [
      {
        source: '/stream',
        // 直接將請求代理到公開的 ngrok TCP 位址。
        // 注意：ngrok 免費方案的位址每次重啟都會改變。
        destination: 'http://0.tcp.jp.ngrok.io:11783/',
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
