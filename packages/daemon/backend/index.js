const http = require('./http.js')
const websocketRpc = require('./websocket.js')

const packages = []

packages.push({
  gives: 'server',
  needs: ['bus'],
  create: http
})

packages.push({
  gives: 'rpc',
  needs: ['server', 'state', 'root'],
  create: websocketRpc
})

module.exports = packages

