const State = require('../core/backend/state')
const getConfig = require('./src/config.new')

const packages = [
  {
    gives: 'state',
    needs: [],
    create: (api) => new State(api)
  },
  {
    gives: 'config',
    needs: [],
    create: getConfig
  }
]

module.exports = packages
