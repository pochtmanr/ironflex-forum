import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Vercel-like optimizations for fast builds
  compiler: {
    // Keep console logs for debugging email issues
    // removeConsole: process.env.NODE_ENV === 'production',
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
        protocol: 'https',
        hostname: 'tarnovsky.ru',
        pathname: '/**',
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
};

export default nextConfig;
