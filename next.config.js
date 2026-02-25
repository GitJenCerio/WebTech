/** @type {import('next').NextConfig} */
const path = require('path');

// Use forward slashes for module resolution (fixes Turbopack Windows path issue)
const esToolkitGetPath = path.join(__dirname, 'node_modules', 'es-toolkit', 'compat', 'get.js').replace(/\\/g, '/');

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
    qualities: [75, 90],
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
  // Turbopack alias (forward slashes for Windows compatibility)
  turbopack: {
    resolveAlias: {
      'es-toolkit/compat/get': esToolkitGetPath,
    },
  },
  // Webpack alias for es-toolkit
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'es-toolkit/compat/get': esToolkitGetPath,
    };
    return config;
  },
}

module.exports = nextConfig

