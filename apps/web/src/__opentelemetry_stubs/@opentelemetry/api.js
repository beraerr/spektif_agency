// Stub module for OpenTelemetry API to prevent Edge Runtime errors
// This is a no-op implementation that prevents build errors when OpenTelemetry
// is not available or disabled in Edge Runtime environments

const noop = () => {}
const noopObj = {}

// Support both CommonJS and ESM
const stub = {
  trace: {
    getTracer: () => ({
      startSpan: noop,
      getActiveSpan: () => null,
      setSpan: noop,
      withSpan: (span, fn) => fn(),
    }),
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

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = stub
}

// ESM export
if (typeof exports !== 'undefined') {
  exports.default = stub
  Object.keys(stub).forEach(key => {
    exports[key] = stub[key]
  })
}
