import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@swingiq/core'],
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
