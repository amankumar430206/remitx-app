// Must be first — patches Hermes URL before any expo module loads
const { URL, URLSearchParams } = require('whatwg-url')
global.URL = URL
global.URLSearchParams = URLSearchParams

const { registerRootComponent } = require('expo')
const { default: App } = require('./App')
registerRootComponent(App)
