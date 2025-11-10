import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Vercel-like optimizations for fast builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Skip type checking during build for speed
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true',
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint warnings during build
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'fileserver',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'tarnovsky.ru',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vk.com',
        pathname: '/**',
      },
    ],
    // Disable image optimization entirely - just serve images as-is
    // This prevents Next.js from trying to optimize uploaded images
    unoptimized: true,
  },
  // Proxy /uploads/ requests to the fileserver API
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/files/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
