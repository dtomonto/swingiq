/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@swingiq/core'],
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
