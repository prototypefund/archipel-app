var hypergraph = require('hyper-graph-db')

// module.exports = {
//   gives: 'graph',
//   needs: ['util', 'bus', 'workspace', 'rpc'],
//   create: init
// }

function init (api) {
  api.bus.on('archive.create', (archive) => {
    var keypair = api.util.keypair()
    var storage = archive.workspace.storage('graph', keypair)
    var graph = hypergraph(storage, keypair.key, keypair.opts)
    archive.updateInfo({graph: api.util.hex(keypair.key)})
    api.bus.emit('graph.create', graph)
  })

  api.bus.on('archive.open', (archive) => {
    var info = archive.info
    var storage = archive.workspace.storage('graph')
    var graph = hypergraph(storage, info.graph.key)
    archive.mount('graph', { type: 'hypergraph', db: graph })
  })

  api.bus.on('rpc.init', (rpcApi, hyperpc) => {
    rpcApi.hypergraph = hyperpc.rpcify(hypergraph, {
      factory: ([wsk, archiveKey]) => {
        var ws = api.workspace.get(wsk)
        var archive = ws.archive(archiveKey)
        var graph = archive.mounts.graph
        return graph
      }
    })
  })
  return {}
}
