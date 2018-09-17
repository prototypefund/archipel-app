var ArchipelRoot = require('./root.js')
var createConfig = require('./config.js')
var createState = require('./state.js')

module.exports = [
  {
    gives: 'state',
    needs: [],
    create: (api) => createState
  },
  {
    gives: 'config',
    needs: [],
    create: (api) => createConfig
  },
  {
    gives: 'root',
    needs: ['config', 'state'],
    create: (api) => ArchipelRoot(api)
  }
]
