import React from 'react'
import { connect } from 'react-redux'
import { openWorkspace } from './../../api/workspace'
import { Button } from 'archipel-ui'
import fileReader from 'filereader-stream'

function dirlist (drive, cb) {
  const list = []
  let missing = 0
  rec('', list)

  function rec (dir, list) {
    drive.readdir(dir, (err, names) => {
      names = names.filter((n) => n)
      missing = missing + names.length
      if (err || !names.length) maybeDone()
      else names.forEach((name) => onPath(dir + '/' + name, name))
    })
  }

  function onPath (path, name) {
    drive.stat(path, (err, stat) => {
      if (err) return

      const val = {name, stat, path, dir: stat.isDirectory(), children: []}
      const pos = list.push(val)

      missing--
      if (val.dir) rec(path, list[pos - 1].children)
      else maybeDone()
    })
  }

  function maybeDone () {
    if (!missing) cb(null, list)
  }
}

const Dirlist = ({dirlist, setPath}) => (
  <ul className='pl-2'>
    {dirlist.map((dir, i) => <li key={i} className={dir.dir ? 'text-blue' : 'text-red'}>
      <span className='cursor-pointer' onClick={(e) => setPath(dir.path)}>{dir.name}</span>
      {dir.children && <Dirlist dirlist={dir.children} setPath={setPath} />}
    </li>)}
  </ul>
)

class FileView extends React.Component {
  constructor () {
    super()
    this.state = {
      content: '',
      type: null
    }
  }
  componentDidUpdate (prevProps, prevState, snapshot) {
    if (this.props.path !== prevProps.path) {
      const archive = this.props.archive
      const Workspace = openWorkspace(this.props.workspace)
      Workspace.getDrive(archive.drive.key, (err, drive) => {
        if (err) return console.log(err)
        drive.readFile(this.props.path, (err, data) => {
          if (err) return console.log(err)
          console.log('file data', data)
          if (this.props.path.substr(-3) === 'jpg') {
            var src = 'data:image/jpeg;base64,' + uint8tob64(data)
            this.setState({ type: 'jpg', content: src })
          } else {
            this.setState({ type: 'text', content: data.toString('utf-8') })
          }
        })
      })
    }
  }

  render () {
    if (!this.state.content) return <div><em>Select file</em></div>
    return (<div>
      <em>{this.props.path}</em><hr />
      { this.state.type === 'text' && <code>{this.state.content}</code> }
      { this.state.type === 'jpg' && <img src={this.state.content} /> }
    </div>)
  }
}

class ShowArchive extends React.Component {
  constructor () {
    super()
    this.state = {
      archive: null,
      datjson: null,
      dirPath: '/',
      dirlist: [],
      path: null
    }
    this.onUpload = this.onUpload.bind(this)
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

      dirlist(drive, (err, data) => {
        if (err) return
        if (data) this.setState({dirlist: data})
      })
    })
  }

  onUpload (e) {
    if (this.refs.upload.files[0]) {
      var file = this.refs.upload.files[0]
      console.log(file)
      var reader = fileReader(file)
      reader.on('end', () => 'rs end')
      const Workspace = openWorkspace(this.props.workspace)
      Workspace.getDrive(this.props.archive, (err, drive) => {
        if (err) console.log(err)
        drive.createWriteStream(file.name, (err, ws) => {
          if (err) return console.log(err)
          reader.pipe(ws)
          ws.on('error', (err) => console.log('ws err', err))
          ws.on('finish', () => console.log('ws finish'))
        })
      })
    } else {
      console.log('no file')
    }
  }

  render () {
    console.log('render', this.state)
    const { archive, datjson, dirlist, path } = this.state
    if (!archive) return <span>No archive</span>

    return (
      <div className='p-4'>
        <em>Show archive</em>
        <h2>{archive.title}</h2>
        <div className='flex'>
          <div className='p-2 border-2 w-64'>
            { dirlist && <Dirlist dirlist={dirlist} setPath={(path) => this.setState({path})} /> }
          </div>
          <div className='p-2 border-2'>
            <FileView archive={archive} path={path} workspace={this.props.workspace} />
          </div>
        </div>

        <div className='p-4 border-2 border-blue'>
          <input type='file' ref='upload' />
          <Button onClick={this.onUpload}>Upload</Button>
        </div>

        <h5 className='mt-24'>Helpers (in DevConsole)</h5>
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
      </div>
    )
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

function uint8tob64 (buf) {
  var binstr = Array.prototype.map.call(buf, function (ch) {
    return String.fromCharCode(ch)
  }).join('')
  var b64 = window.btoa(binstr)
  return b64
  // var b64str = ''
  // var len = bytes.byteLength
  // for (var i = 0; i < len; i++) {
  //   b64str += String.fromCharCode(bytes[i])
  // }
  // return window.btoa(b64str)
}

function arrayBufferToBase64 (buf) {
  var binary = ''
  var bytes = new Uint8Array(buf)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
