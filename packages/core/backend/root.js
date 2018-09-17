var hyperdb = require('hyperdb')
var hyperdrive = require('hyperdrive')
var thunky = require('thunky')
var path = require('path')
var raf = require('random-access-file')
var rpcify = require('hyperpc').rpcify

var Workspace = require('./workspace.js')

function ArchipelRoot (api) {
  if (!(this instanceof ArchipelRoot)) return new ArchipelRoot()

  this.api = api
  this.workspaces = {}
  this.storage = this.createStorage(this.api.config.rootPath)

  this.ready = thunky(this._init.bind(this))
  this.ready()

  api.state.on('rpc.collect', (cb, ws) => {
    cb(ws.rpcApi())
    return ws.rpcApi
    return {
      hyperdrive: rpcify(hyperdrive, {
        factory: (key) => ws.get('drive', key)
      }),
      createArchive: (title, cb) => {
        ws
      }
    }
  })
}

ArchipelRoot.prototype._init = async function (done) {
  const conf = await this.config()
  this.config = conf.get()
  this.root = this.config.dbPath
  this.rootDbPath = path.join(this.root, 'root')
  try {
    this.db = hyperdb(this.storage('root'))
    this.db.ready(done)
  } catch (err) {
    this._init(err, null)
  }
}

ArchipelRoot.prototype.getWorkspace = function (key, cb) {
  this.getWorkspaces(onready)

  function onready (err, workspaces) {
    if (err) return cb(err)
    if (workspaces[key]) cb(null, workspaces[key])
    else cb(new Error(), null)
  }
}

ArchipelRoot.prototype.getWorkspaces = function (cb) {
  var self = this
  if (this.workspaces) return cb(null, this.workspaces)
  this.db.ready(load)

  function load () {
    if (!cb) cb = noop

    var rs = this.db.createReadStream('workspaces')

    rs.on('data', (nodes) => {
      var value = nodes[0].value
      var key = value.discoveryKey
      self.workspaces[value.key] = Workspace(self.storage('workspace/' + key))
    })

    rs.on('end', () => {
      self.init = true
      cb()
    })
  }
}

ArchipelRoot.prototype.createStorage = function (rootPath) {
  // if (typeof storage === 'function') return storage
  return function (name) {
    return raf(path.join(rootPath, name))
  }
}

function noop () {}
