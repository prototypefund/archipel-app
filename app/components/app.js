'use strict'

import React, { Component } from 'react'

import { Box, Flex, Heading, Button, BrightButton, Input } from './base'
import Style from './style'
import Item from './item'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {input: 'foo'}
  }
  render () {
    const {title, counter, clickIncrement, doFooTest, doStreamingTest, theme} = this.props
    const apiTestClick = () => {
      doStreamingTest('lets see if this works')
    }
    return <div>
      <Box px={4} py={5} color='white' bg='navy'>
        <Heading>{title}</Heading>
        <Input onChange={(ev) => this.setState({input: ev.target.value})} value={this.state.input} />
        <BrightButton onClick={apiTestClick}>Do Streaming Test</BrightButton>
        <BrightButton onClick={() => doFooTest(this.state.input)}>Do Foo Test</BrightButton>
      </Box>
      <Flex px={4} py={5}>
        <Box>Count: {counter}</Box>
        <Box mx='auto' />
        <Button onClick={clickIncrement}>Increment</Button>
      </Flex>
      <Item title='Hello' />
      <Box p={4}>
        <Style theme={theme} />
      </Box>
    </div>
  }
}