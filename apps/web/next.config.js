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
    // Disable OpenTelemetry to prevent Edge Runtime issues
    OTEL_SDK_DISABLED: 'true',
  },
  // Enable standalone output for better Vercel deployment (only in production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  webpack: (config, { isServer, isEdgeRuntime }) => {
    // For Edge Runtime (middleware), use stub modules for OpenTelemetry
    if (isEdgeRuntime) {
      config.resolve = config.resolve || {}
      config.resolve.alias = config.resolve.alias || {}
      const path = require('path')
      const stubPath = path.resolve(__dirname, 'src/__opentelemetry_stubs')
      config.resolve.alias['@opentelemetry/api$'] = path.join(stubPath, '@opentelemetry/api.js')
      config.resolve.alias['@opentelemetry/instrumentation$'] = path.join(stubPath, '@opentelemetry/instrumentation.js')
      config.resolve.alias['@opentelemetry/api-metrics$'] = path.join(stubPath, '@opentelemetry/api.js')
      config.resolve.alias['@opentelemetry/core$'] = path.join(stubPath, '@opentelemetry/api.js')
    }
    // Fix for OpenTelemetry/Firebase bundling issues on server
    if (isServer && !isEdgeRuntime) {
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push({
          '@opentelemetry/api': 'commonjs @opentelemetry/api',
          '@opentelemetry/instrumentation': 'commonjs @opentelemetry/instrumentation',
        })
      }
    }
    return config
  },
}

module.exports = withNextIntl(nextConfig)