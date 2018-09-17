#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

var root = path.join(__dirname, '..')
var ppath = path.join(root, 'packages')

var command = process.argv[2] || null
console.log(command)

var info
try {
  // var info = fs.readFileSync(path.join(root, 'archipel.json'))
  info = require(path.join(root, 'archipel.json'))
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') info = {}
  else kill(e)
}

fs.readdir(ppath, function (err, dirs) {
  if (err) return console.error('Path %s not found', ppath)
  var packages = dirs.reduce((packages, name) => {
    if (fs.lstatSync(path.join(ppath, name)).isDirectory()) {
      packages.push(name)
    }
    if (command === 'makepkgjson') {
      var pkgjson = {
        name: '@archipel/' + name,
        version: info.version,
        license: info.license,
        main: 'backend',
        browser: 'frontend'
      }
      var pkgpath = path.join(ppath, name, 'package.json')
      if (!fs.existsSync(pkgpath)) {
        fs.writeFileSync(pkgpath, JSON.stringify(pkgjson, null, 2))
        console.log('Written pkgjson for ' + name)
      } else {
        console.log('Skipped pkgjson for ' + name)
      }
    }
    return packages
  }, [])
  
  info.packages = packages
  var json = JSON.stringify(info, null, 2)
  try {
    fs.writeFileSync(path.join(root, 'archipel.json'), json)
  } catch (e) { kill(e) }
})

function kill (e) {
  if (e instanceof Error) {
    console.error('Error code: ' + e.code)
    console.error(e.message)
  }
  else {
    console.error(e)
  }
  process.exit(1)
}
