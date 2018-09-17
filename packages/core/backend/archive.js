var EventEmitter = require('EventEmitter')
var crypto = require('hypercore-crypto')
var hyperdrive = require('hyperdrive')
var thunky = require('thunky')

function Archive (workspace, keys, info) {
  if (!(this instanceof Archive)) return new Archive(workspace)
  EventEmitter.call(this)

  this.workspace = workspace
  this.info = info || {}
  this.ensureKeys(keys)

  this.opened = false
  this.ready = thunky(this._open.bind(this))
  this.get = (cb) => this.ready(() => cb(null, this))
}

Archive.prototype = Object.assign({}, EventEmitter.prototype)

Archive.prototype._open = function (cb) {
  this.ensureKeys()
  this.drive = hyperdrive(this.workspace.createStorage('drive', this.keys.discoveryKey), this.key)
  this.mount('drive', this.drive)
  this.emit('open', this)
  this.opened = true
  cb()
}

Archive.prototype.setInfo = function (info, cb) {
  this.info = info
  this.drive.writeFile('dat.json', JSON.stringify(info, null, 2))
  this.workspace.putArchive(this)
}

Archive.prototype.serializeKeys = function () {
  return Object.keys(this.keys).reduce((ret, key) => {
    ret[key] = this.keys[key].toString('hex')
    return ret
  })
}

Archive.prototype.ensureKeys = function (keys) {
  if (!keys.publicKey) {
    var keyPair = crypto.keyPair()
    var discoveryKey = crypto.discoveryKey(keyPair.publicKey)
    this.keys = keyPair
    this.keys.discoveryKey = discoveryKey
    this.info.keys = this.keys.map(key => key.toString('hex'))
  } else {
    this.keys = Object.keys(keys).reduce((ret, key) => {
      ret[key] = Buffer.isBuffer(keys[key]) ? keys[key] : Buffer.from(keys[key], 'hex')
    })
  }
  this.key = this.keys.publicKey
}

Archive.prototype.init = function () {
}

Archive.prototype.mount = function (name, obj) {
  this.mounts[name] = obj
}

Archive.prototype.get = function (name, cb) {
  if (this.mounts[name]) {
    cb(null, this.mounts[name])
    return this.mounts[name]
  } else cb(null, null)
}

Archive.prototype.replicate = function (opts) {
  var stream = this.drive.replicate(opts)
  // Also replicate all mounts if they have a compatible replicate method.
  opts.stream = stream
  Object.keys(this.mounts).forEach((name) => {
    this.mounts[name].replicate(opts)
  })
}

function hex (bufOrStr) {
  if (Buffer.isBuffer(bufOrStr)) return bufOrStr.toString('hex')
  return bufOrStr
}
