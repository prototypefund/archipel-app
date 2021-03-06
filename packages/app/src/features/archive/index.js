import storeConstructor from './store'
import ArchiveInfo from './ArchiveInfo'

export default {
  plugin: archivePlugin
}

async function archivePlugin (core, opts) {
  core.components.add('archiveTabs', ArchiveInfo, { title: 'Info' })

  let store = core.makeStore('archive', storeConstructor)

  core.getStore('workspace').subscribe(onWorkspaceChange, 'current')
  function onWorkspaceChange (state, oldState) {
    store.loadArchives()
  }

  core.rpc.reply('archive/writeNetworkStats', (req) => {
    core.getStore('archive').writeNetworkStats(req)
  })
}
