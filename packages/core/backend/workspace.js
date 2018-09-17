const hyperdb = require('hyperdb')
const raf = require('random-access-file')
const path = require('path')
const Archive = require('./archive.js')

module.exports = Workspace

function Workspace (storageOrPath) {
  if (!(this instanceof Workspace)) return new Workspace(storageOrPath)

  this.cache = {}

  this._storageOrPath = storageOrPath
  this._storage = this.createStorage('space')
  var dbOpts = {
    reduce: (a, b) => a
  }
  this._db = hyperdb(this._storage, dbOpts)

  this._db.ready(this.init.bind(this))
}

Workspace.prototype.db = function (cb) {
  if (cb) cb(this._db)
  else return this._db
}

Workspace.prototype.init = function (cb) {
  var self = this
  var rs = this._db.createReadStream('archives')
  rs.on('data', (node) => {
    self.archives[node.value.key] = new Archive(this, node.value)
  })
  rs.on('end', () => {
    if (cb) cb(null, self.archives)
  })
}

Workspace.prototype.putArchive = function (archive) {
  var key = archive.keys.publicKey.toString('hex')
  this._db.put(key, {
    info: archive.info,
    keys: archive.serializeKeys()
  })
}

Workspace.prototype.createArchive = function (title) {
  var self = this
  var archive = new Archive(this, title)
  archive.open((err, archive) => {
    if (err) return // todo: handle
    archive.setInfo({title: title})
    self._db.put({
      info: archive.info,
      keys: archive.serializeKeys()
    })
  })
}

// todo: ensure name is within rootPath
Workspace.prototype.createStorage = function (type, key) {
  if (typeof this.storageOrPath === 'function') return this.storageOrPath(type, key)
  var dir = path.join(this.storageOrPath, type)
  if (Buffer.isBuffer(key)) key = Buffer.toString('hex')
  if (key) dir = path.join(dir, key)
  return function (name) {
    return raf(path.join(dir, name))
  }
}

Workspace.prototype.rpcApi = function () {
  // var self = this
  // return {
  //   hyperdrive: rpcify(hyperdrive, {
  //     factory: (key) => self.archives[key] ? self.archives[key] : null
  //   }),
  // }
}

// Workspace.prototype.add = function (type, key, obj) {
//   this.cache[type] = this.cache[type] || {}
//   this.cache[type][key] = obj
// }

// Workspace.prototype.get = async function (type, key, cb) {
//   if (this.cache[type] && this.cache[type][key]) {
//     if (cb) cb(null, this.cache[type][key])
//     else return this.cache[type][key]
//   }
//   var err = new Error('Not found.')
//   if (cb) cb(err)
//   else throw err
// }
