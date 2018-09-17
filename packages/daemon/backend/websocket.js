var rpc = require('hyperpc')
var ws = require('websocket-stream')
var pump = require('pump')
var url = require('url')

module.exports = makeRpc

function makeRpc (api) {
  var server = api.server
  var wsOpts = {
    perMessageDeflate: false,
    server: server
  }
  this.ws = ws.createServer(wsOpts, handle)
  this.ws.on('error', (err) => console.log('ws server: error', err))
  this.ws.on('connection', function (socket) {
    socket.on('close', (err) => console.log('ws socket: client closed connection', err))
    socket.on('error', (err) => console.log('ws socket: error', err))
  })

  function handle (wsStream, req) {
    // collect rpc methods.
    var pathname = url.parse(req.url).pathname.split('/')
    if (!pathname.indexOf('/rpc/') === 0) return close()
    var key = pathname.split('/')[1]

    var ws = api.root.getWorkspace(key)
    if (!ws) return close()

    var count = api.state.listenerCount('rpc.collect')
    var methods = {}
    api.state.emit('rpc.collect', ws, (newMethods) => {
      Object.keys(newMethods).reduce((methods, name) => {
        methods[name] = newMethods[name]
        return methods
      }, methods)
      if (!--count) finish()
    })

    function finish () {
      wsStream.on('error', (err) => console.log('ws stream: error', err))
      var rpcStream = rpc(methods, {debug: true})
      rpcStream.on('remote', (remote) => api.state.emit('rpc.remote', ws, remote))
      pump(rpcStream, wsStream, rpcStream)
    }

    function close () {
      wsStream.destroy()
    }
  }
}
