var fs = require('fs')
var path = require('path')
var minimist = require('minimist')
var appConfig = require('application-config-path')
var pfy = require('util').promisify

module.exports = getConfig

class Config {
  constructor (configPath) {
    this._config = {}
    this._configPath = configPath
    try {
      this._config = require(configPath)
    } catch (e) {}

    var env = this._parseEnv('ARCHIPEL_')
    Object.keys(env).forEach(prop => { this._config[prop] = env[prop] })
  }

  get () {
    return Object.assign({}, this._config)
  }

  _parseEnv (prefix) {
    return Object.keys(process.env).reduce((props, name) => {
      if (name.indexOf(prefix) === 0) {
        var prop = envToProp(name.substr(prefix.length))
        props[prop] = process.env[name]
      }
      return props
    }, {})
  }
}

function getConfig (api) {
  let config = null

  return async function () {
    if (config) return config
    else {
      config = await initConfig()
      return config
    }
  }

  async function initConfig () {
    const dev = process.env.NODE_ENV === 'development'
    const names = []
    if (dev) names.push('archipel.development.json')
    names.push('archipel.json')

    try {
      const confPath = await pfy(getConfigPath)(names)
      return new Config(confPath)
    } catch (e) {
      throw e
    }
  }
}

function getConfigPath (names, cb) {
  var argv = minimist(process.argv.slice(2))

  if (argv.c) {
    return fs.statSync(argv.c).isFile() ? cb(null, argv.c) : cb(new Error('Config file %s not found.', argv.c))
  }

  var fp = null
  if (process.env.NODE_ENV === 'production') {
    fp = fileInFolder(appConfig('ArchipelApp'), names)
  }

  if (!fp) {
    fp = fileInParents(__dirname, names)
  }

  if (!fp) cb(new Error('No config file found.'))
  else cb(null, fp)
}

function fileInFolder (dir, names) {
  for (var i = 0; i < names.length; i++) {
    var fp = path.join(dir, names[i])
    try {
      if (fs.statSync(fp).isFile()) return fp
    } catch (e) {}
  }
  return null
}

function fileInParents (dir, names) {
  var ret = rec(dir)
  return ret

  function rec (dir) {
    dir = path.resolve(dir)
    var fp = fileInFolder(dir, names)
    if (fp) return fp
    else {
      var parent = path.resolve(path.join(dir, '..'))
      if (parent !== dir) return rec(parent)
      else return null
    }
  }
}

function envToProp (env) {
  return env.split('_').reduce((ret, part) => {
    part = part.toLowerCase()
    if (ret) part = part.charAt(0).toUpperCase() + part.substr(1)
    return ret + part
  }, '')
}
