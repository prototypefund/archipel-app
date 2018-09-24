import React from 'react'
import { connect } from 'react-redux'
import { openWorkspace } from './../../api/workspace'
import { Button, Flexbox } from '@archipel/ui'
import '@archipel/ui/tailwind.pcss'

class ShowArchive extends React.Component {
  constructor () {
    super()
    this.state = {
      archive: null,
      datjson: null,
      fileTree: [],
      view: 'listView'
    }
  }

  componentDidMount () {
    const archive = this.props.archives[this.props.archive]
    this.setState({archive})

    const Workspace = openWorkspace(this.props.workspace)
    Workspace.getDrive(archive.drive.key, (err, drive) => {
      if (err) return console.log(err)
      drive.readFile('/dat.json', (err, data) => {
        if (err) return console.log(err)
        this.setState({ datjson: data.toString('utf-8') })
      })

      getFileTree(drive, (err, data) => {
        if (err) return console.log('getFileTree_cb', err)
        if (data) {
          this.setState({
            fileTree: data
          })
        }
      })
    })
  }

  render () {
    return (
      // View selector
      <div>
        <div className='bg-grey'>
          <Button onClick={() => { this.setState({view: 'listView'}) }}>List View</Button>
          <Button onClick={() => { this.setState({view: 'gridView'}) }}>Grid View</Button>
          <Button onClick={() => { this.setState({view: 'graphView'}) }}>Graph View</Button>
        </div>
        <View view={this.state.view} fileTree={this.state.fileTree} />
        <small>
          <blockquote>
            <strong>readFile:</strong>
            <pre>
            rpc((api) => api.workspace.drive.readFile('{this.props.workspace}', '{this.props.archive}', 'directory1/textfile.txt', (err, data) => console.log('readFile', err, data) ) )
            </pre>
            <strong>writeFile:</strong>
            <pre>
            rpc((api) => api.workspace.drive.writeFile('{this.props.workspace}', '{this.props.archive}', 'directory1/textfile.txt', 'Hello world!', {'{}'}, (err, data) => console.log('writeFile', err, data) ) )
            </pre>
            <strong>mkdir</strong>
            <pre>
            rpc((api) => api.workspace.drive.mkdir('{this.props.workspace}', '{this.props.archive}', 'directory1', {'{}'}, (err, data) => console.log('mkdir', err, data)))
            </pre>
          </blockquote>
        </small>
      </div>
    )
  }
}

function View (props) {
  switch (props.view) {
    case 'listView':
      return <ListView fileTree={props.fileTree} />
    case 'gridView':
      return <GridView fileTree={props.fileTree} />
    case 'graphView':
      return <GraphView />
    default:
      return <ListView />
  }
}

// ListView using flexbox
class ListView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      fileTree: [],
      jsxElements: []
    }
    // this.flexview = flexview.bind(this)
  }

  componentDidUpdate () {
    if (this.state.fileTree.length === 0) {
      this.state.fileTree = this.props.fileTree
    }
  }

  flexview (fileTree, indexArr) {
    for (var i = 0; i < fileTree.length; i++) {
      if (fileTree[i].dir && fileTree[i].open) {
        this.state.jsxElements.push(this.flexItem(fileTree[i], [...indexArr, i]))
        this.flexview(fileTree[i].children, [...indexArr, i])
      } else {
        this.state.jsxElements.push(this.flexItem(fileTree[i], [...indexArr, i]))
      }
    }
    // need to return something to invoke rerendering at call in this.render()
    if (indexArr.length === 0) return this.state.jsxElements
  }

  flexItem (fileTreeElem, indexArr) {
    return (
      <Flexbox
        className='flex-row items-stretch'
        key={indexArr.toString()}
        id={indexArr.toString()}
        onClick={() => {
          this.setState({
            fileTree: this.handleClick(indexArr)
          })
        }}
      >
        <div className='bg-grey-light px-4 py-2 m-2'>{arrows(fileTreeElem.depth)}</div>
        <div className='bg-grey-light px-4 py-2 m-2'>{fileTreeElem.name}</div>
        <div className='bg-grey-light px-4 py-2 m-2'>{fileTreeElem.path}</div>
      </Flexbox>
    )
  }

  handleClick (indexArr) {
    let fileTree = this.state.fileTree

    function getToItemRecly (fileTree, indexArr) {
      if (indexArr.length > 1) {
        fileTree[indexArr[0]].children = getToItemRecly(
          fileTree[indexArr[0]].children,
          indexArr.slice(1, indexArr.length)
        )
        return fileTree
      }
      if (indexArr.length === 1) {
        fileTree[indexArr[0]].open = !fileTree[indexArr[0]].open
        return fileTree
      }
    }
    fileTree = getToItemRecly(fileTree, indexArr)

    return fileTree
  }

  render () {
    this.state.jsxElements = []
    return (
      <div className='bg-teal'>
        <div className='bg-teal'>ListView</div>
        <Flexbox className='flex-col'>{this.flexview(this.state.fileTree, [])}</Flexbox>
      </div>
    )
  }
}

class GridView extends React.Component {
  render () {
    return (
      <div className='bg-teal'>GridView</div>
    )
  }
}

class GraphView extends React.Component {
  render () {
    return (
      <div className='bg-teal'>GraphView</div>
    )
  }
}

function arrows (number = 0) {
  let str = ''
  for (let i = 0; i < number; i++) {
    str += '-> '
  }
  return str
}

function getFileTree (drive, cb) {
  let fileTree = []
  let depth = 0 // fielTreeDepth
  let missingDirElem = 0 // intialized here to make available to maybeDone()
  constrFileTreeArrayRecly('', fileTree, depth)

  function constrFileTreeArrayRecly (dir, fileTree, depth) {
    drive.readdir(dir, (err, names) => {
      names = names.filter((n) => n)
      missingDirElem = names.length // missing elements in directory
      if (!names.length) maybeDone()
      if (err) return
      names.forEach((name) => {
        var path = dir + '/' + name
        drive.stat(path, (err, stat) => {
          var shared = {name, stat, path, depth}
          if (err) return
          if (stat.isDirectory()) {
            var pos = fileTree.push({...shared, dir: true, open: false, children: []})
            constrFileTreeArrayRecly(path, fileTree[pos - 1].children, depth + 1)
          } else {
            fileTree.push({...shared, dir: false})
            missingDirElem--
            maybeDone()
          }
        })
      })
    })
  }

  function maybeDone () {
    if (!missingDirElem) cb(null, fileTree)
  }
}

const mapDispatchToProps = dispatch => ({
})

const mapStateToProps = (state, props) => ({
  archives: state.archives,
  archive: state.ui.archive,
  workspace: state.workspace
})

export default connect(mapStateToProps, mapDispatchToProps)(ShowArchive)
