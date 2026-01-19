/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'firebase', 'firebase-admin'],
  },
  images: {
    domains: [
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    // Disable Next.js built-in telemetry
    NEXT_TELEMETRY_DISABLED: '1',
  },
  // Enable standalone output for better Vercel deployment (only in production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
}

module.exports = withNextIntl(nextConfig)