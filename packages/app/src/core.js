// ucore
import ucore from 'ucore'
import rpc from 'ucore/rpc/client'
import store from 'ucore/store'

// core
import componentRegistry from './lib/component-registry'
import app from './features/app'
import workspace from './features/workspace'
import archive from './features/archive'

// settings
const websocketUrl = window.ARCHIPEL_WEBSOCKET_URL
  ? window.ARCHIPEL_WEBSOCKET_URL
  : window.location.origin.replace(/^http/, 'ws') + '/ucore'

function boot (extensions) {
  // ucore
  const core = ucore()
  core.register(rpc, { url: websocketUrl })
  core.register(store)

  // core libs
  core.use(componentRegistry)

  // core features
  core.register(app)
  core.register(workspace)
  core.register(archive)

  extensions.forEach(extension => core.register(extension))

  window.archipelCore = core

  return core
}

export default boot
