import React from 'react'

const collectStream = rs => new Promise((resolve, reject) => {
  let triples = []
  rs.on('data', (nodes) => triples.push(nodes[0].value))
  rs.on('end', () => resolve(triples))
  rs.on('error', (err) => reject(err))
})

export default {
  gives: 'graph',
  needs: ['state', 'bus', 'route', 'rpc'],
  create: init
}

class Graph {
  constructor (api, key) {
    this.api = api
    this.key = key
    this.hg = api.rpc.hypergraph(key)
  }

  async loadAll () {
    try {
      const rs = await this.hg.readStream()
      const data = await collectStream(rs)
      return data
    } catch (e) {}
  }

  query () {}
}

const store = {
  initialState: {
    graphs: {}
  },

  reducer: (state, action) => {
    switch (action.type) {
      case 'graph.update':
        return { ...state, graph: { ...state.graph, ...action.value } }
    }
    return state
  }
}

function init (api) {
  const graphs = {}

  const getGraph = (key) => graphs[key] ? graphs[key] : null

  const initGraph = (key) => {
    graphs[key] = new Graph(api, key)
  }

  api.state.addStore(store)

  api.route(':key/graph', {
    main: api.react.connect(mapState, GraphComponent)
  })

  api.bus.on('archive.open', (archive) => {
    if (archive.info.graph) initGraph(archive.info.graph)
  })

  return { getGraph, initGraph }
}

// sync/direct func
const updateTitle = (value) => {
  let title = value.toUpperCase()
  return { type: 'graph.update', value: { title } }
}

const loadGraph = (key) => async (dispatch, api) => {
  const triples = await api.graph.getGraph(key).loadAll()
  dispatch({
    type: 'graph.triples',
    key,
    triples
  })
}

const mapState = (state, props) => {
  let archive = state.archives[state.archive]
  if (!archive || !archive.graph) return {}
  let graph = state.graphs[archive.graph]
  return {
    key: graph.key,
    title: graph.title
  }
}

const GraphComponent = ({dispatch, title, key}) => {
  let titleInput

  return (<div>
    <h3>{title}</h3>
    <input type='text' ref={el => { titleInput = el }} />
    <button onClick={e => dispatch(updateTitle(titleInput.value))}>Update Title</button>
    <button onClick={e => dispatch(loadGraph(key))}>Load</button>
  </div>)
}

GraphComponent.defaultProps = {
  dispatch: () => {},
  title: 'Test',
  key: null
}
