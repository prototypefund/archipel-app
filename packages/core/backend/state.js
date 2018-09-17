const EventEmitter = require('events').EventEmitter

class State extends EventEmitter {
  constructor () {
    super()
    this._state = {}
  }

  getState () {
    return Object.assign({}, this._state)
  }

  setState (state) {
    if (state !== this._state) {
      const oldState = this._state
      this._state = Object.assign({}, state)
      this.emit('state.change', oldState, this.getState())
    }
  }
}

module.exports = State
