// next.config.js
const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin(path.resolve('./i18n/request.ts'));

// Lấy origin từ .env (fallback dev)
const assets = new URL(process.env.ASSETS_ORIGIN || 'http://localhost:3001');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cho phép next/image load ảnh từ backend
  images: {
    remotePatterns: [
      {
        protocol: assets.protocol.replace(':', ''), // 'http' | 'https'
        hostname: assets.hostname,                  // 'localhost' | 'cdn.domain.com'
        port: assets.port || undefined,             // '3001' | undefined
        pathname: '/assets/**',
      },
    ],
  },

  // Proxy /assets -> backend để FE có thể dùng URL tương đối /assets/...
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: `${assets.origin}/assets/:path*`,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
