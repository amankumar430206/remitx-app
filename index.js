// Patch URL.prototype.protocol before expo-asset loads.
// expo-asset's getManifestBaseUrl() sets urlObject.protocol which is getter-only
// in Hermes. The function already has a href.replace() fallback, so a no-op
// setter is all that's needed to prevent the crash.
const desc = Object.getOwnPropertyDescriptor(URL.prototype, 'protocol')
if (desc && !desc.set) {
  Object.defineProperty(URL.prototype, 'protocol', {
    get: desc.get,
    set(_v) {},
    configurable: true,
  })
}

const { registerRootComponent } = require('expo')
const { default: App } = require('./App')
registerRootComponent(App)
