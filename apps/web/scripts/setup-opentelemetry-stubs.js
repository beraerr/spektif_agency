#!/usr/bin/env node
/**
 * Setup script to create OpenTelemetry stubs in node_modules
 * This ensures Next.js can find the stubs at runtime
 */

const fs = require('fs')
const path = require('path')

const apiDir = path.join(__dirname, '../node_modules/@opentelemetry/api')

// Create directory if it doesn't exist
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true })
}

// Create package.json
fs.writeFileSync(path.join(apiDir, 'package.json'), JSON.stringify({
  name: '@opentelemetry/api',
  version: '1.8.0',
  main: './index.js',
  types: './index.d.ts'
}, null, 2))

// Create index.js stub
const stubCode = `// Complete stub for @opentelemetry/api that works in Edge Runtime
const noop = () => {}
const noopObj = {}

const createNoopTracer = () => ({
  startSpan: noop,
  getActiveSpan: () => null,
  setSpan: noop,
  withSpan: (span, fn) => fn(),
})

const stub = {
  trace: {
    getTracer: createNoopTracer,
    setSpan: noop,
    getActiveSpan: () => null,
    getSpan: () => null,
    getSpanContext: () => null,
    setSpanContext: noop,
    deleteSpan: noop,
  },
  context: {
    active: () => ({}),
    with: (context, fn) => fn(),
    bind: (context, fn) => fn,
    createContextKey: (name) => Symbol(name || 'context-key'),
  },
  metrics: {
    getMeter: () => ({
      createCounter: () => noopObj,
      createUpDownCounter: () => noopObj,
      createHistogram: () => noopObj,
      createObservableCounter: () => noopObj,
      createObservableGauge: () => noopObj,
      createObservableUpDownCounter: () => noopObj,
    }),
  },
  propagation: {
    extract: () => ({}),
    inject: noop,
    fields: () => [],
  },
  diag: {
    setLogger: noop,
    disable: noop,
    enable: noop,
    setLogLevel: noop,
    verbose: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  },
}

// Export the stub object
const exports = stub

// Ensure all nested properties are accessible
exports.trace = stub.trace
exports.context = stub.context
exports.metrics = stub.metrics
exports.propagation = stub.propagation
exports.diag = stub.diag

// Also export createContextKey at top level in case Next.js expects it there
exports.createContextKey = stub.context.createContextKey

module.exports = exports
`

fs.writeFileSync(path.join(apiDir, 'index.js'), stubCode)

// Create minimal type definitions
const typeDefs = `export const trace: any
export const context: any
export const metrics: any
export const propagation: any
export const diag: any
`

fs.writeFileSync(path.join(apiDir, 'index.d.ts'), typeDefs)

console.log('✓ OpenTelemetry API stub installed in node_modules/@opentelemetry/api')
