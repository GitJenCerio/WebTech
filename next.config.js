/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year - images are static
    // Enable optimization for local images
    unoptimized: false,
    // Ensure all image extensions are supported
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Turbopack (Next.js 16 default) - resolve alias for es-toolkit
  turbopack: {
    root: __dirname,
    resolveAlias: {
      'es-toolkit/compat/get': path.resolve(__dirname, 'node_modules/es-toolkit/compat/get.js'),
    },
  },
  // Webpack fallback - same alias for builds using --webpack
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'es-toolkit/compat/get': path.resolve(__dirname, 'node_modules/es-toolkit/compat/get.js'),
    };
    return config;
  },
}

module.exports = nextConfig

