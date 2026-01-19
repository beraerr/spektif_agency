/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'firebase', 'firebase-admin', '@opentelemetry/api', '@opentelemetry/instrumentation'],
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
    // Disable Next.js built-in OpenTelemetry
    NEXT_TELEMETRY_DISABLED: '1',
  },
  // Enable standalone output for better Vercel deployment (only in production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  webpack: (config, { isServer, isEdgeRuntime, webpack }) => {
    const path = require('path')
    const stubPath = path.resolve(__dirname, 'src/__opentelemetry_stubs')
    
    // AGGRESSIVE: Replace ALL OpenTelemetry imports with stubs using NormalModuleReplacementPlugin
    // This works at the module level, before webpack tries to resolve anything
    const apiStub = path.join(stubPath, '@opentelemetry/api.js')
    const instrumentationStub = path.join(stubPath, '@opentelemetry/instrumentation.js')
    
    // Use NormalModuleReplacementPlugin to replace ALL OpenTelemetry modules
    const opentelemetryPackages = [
      '@opentelemetry/api',
      '@opentelemetry/instrumentation',
      '@opentelemetry/api-metrics',
      '@opentelemetry/core',
      '@opentelemetry/sdk-node',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/context-async-hooks',
      '@opentelemetry/context-zone',
      '@opentelemetry/context-zone-peer-dep',
    ]
    
    opentelemetryPackages.forEach(pkg => {
      const stubFile = pkg.includes('instrumentation') ? instrumentationStub : apiStub
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          new RegExp(`^${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
          stubFile
        )
      )
    })
    
    // Also set up resolve aliases as backup
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}
    
    opentelemetryPackages.forEach(pkg => {
      const stubFile = pkg.includes('instrumentation') ? instrumentationStub : apiStub
      config.resolve.alias[pkg] = stubFile
      config.resolve.alias[`${pkg}$`] = stubFile
    })
    
    // For Edge Runtime, also add to resolve.modules
    if (isEdgeRuntime) {
      config.resolve.modules = config.resolve.modules || []
      if (!config.resolve.modules.includes(stubPath)) {
        config.resolve.modules.push(stubPath)
      }
    }
    
    return config
  },
}

module.exports = withNextIntl(nextConfig)