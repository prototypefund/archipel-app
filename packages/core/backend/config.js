var fs = require('fs')
var path = require('path')
var minimist = require('minimist')
var appConfig = require('application-config-path')

module.exports = getConfig

function getConfig (api) {
  let config = {}
  const dev = process.env.NODE_ENV === 'development'
  const envPrefix = 'ARCHIPEL_'

  const names = []
  if (dev) names.push('archipel.development.json')
  names.push('archipel.json')

  const configPath = getConfigPath(names)
  if (configPath) config = require(configPath)
  const env = parseEnv(envPrefix)
  if (env) config = Object.assign({}, config, env)
  return config
}

function getConfigPath (names) {
  var argv = minimist(process.argv.slice(2))

  if (argv.c) {
    return fs.statSync(argv.c).isFile() ? argv.c : null
  }

  var fp = null
  if (process.env.NODE_ENV === 'production') {
    fp = fileInFolder(appConfig('ArchipelApp'), names)
  }

  if (!fp) {
    fp = fileInParents(__dirname, names)
  }

  return fp
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

function parseEnv (prefix) {
  return Object.keys(process.env).reduce((props, name) => {
    if (name.indexOf(prefix) === 0) {
      var prop = envToProp(name.substr(prefix.length))
      props[prop] = process.env[name]
    }
    return props
  }, {})
}

function envToProp (env) {
  return env.split('_').reduce((ret, part) => {
    part = part.toLowerCase()
    if (ret) part = part.charAt(0).toUpperCase() + part.substr(1)
    return ret + part
  }, '')
}
