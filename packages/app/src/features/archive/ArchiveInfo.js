import React from 'react'
import ReduxQuery from '../util/ReduxQuery'
import { select } from './duck'
import { Heading } from '@archipel/ui'

const ArchiveInfo = ({ archive }) => {
  console.log('ARCHIVEINFO', archive)
  return <ReduxQuery select={select.archiveByKey} archive={archive} async={false} >
    {(archive) => {
      if (!archive) return null
      console.log(archive)
      return (
        <div>
          <Heading>{archive.title}</Heading>
          <pre>{archive.key}</pre>
        </div>
      )
    }}
  </ReduxQuery>
}

export default ArchiveInfo
