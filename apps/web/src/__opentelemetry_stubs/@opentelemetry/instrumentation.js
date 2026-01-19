// Stub module for OpenTelemetry Instrumentation to prevent Edge Runtime errors
// This is a no-op implementation that prevents build errors when OpenTelemetry
// is not available or disabled in Edge Runtime environments

const noop = () => {}
const noopObj = {}

// Support both CommonJS and ESM
const stub = {
  InstrumentationBase: class {
    constructor() {}
    enable() {}
    disable() {}
    isEnabled() { return false }
  },
  registerInstrumentations: noop,
  InstrumentationConfig: {},
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
