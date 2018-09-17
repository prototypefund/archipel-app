var packages = require('./archipel.json').packages
var path = require('path')
var combine = require('depj')

var api = initPackages(packages)

console.log(api.root)
api.root.getWorkspaces()

function initPackages (packages) {
  packages = packages.reduce((ret, name) => {
    var info = require(path.join(__dirname, 'packages', name, 'package.json'))
    var backendPath = path.join(__dirname, 'packages', name, info.main)
    try {
      var backend = require(backendPath)
      if (!Array.isArray(backend)) backend = [backend]
      if (backend) ret = ret.concat(backend)
    } catch (e) { console.log(e) }
    return ret
  }, [])
  packages = packages.filter(o => typeof o === 'object' && o.gives)
  // console.log(packages)
  return combine(packages)
}
