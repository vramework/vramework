import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { CoreUserSession } from '../types/core.types.js'
import { SubscriptionService } from './subscription-service.js'
import { VrameworkChannelHandler } from './vramework-channel-handler.js'

type TestUserSession = CoreUserSession & { userId?: string }

// A stub subscription service for testing
class MockSubscriptionService<Out> implements SubscriptionService<Out> {
  subscribe = async (topic: string, connectionId: string) => {
    /* stub */
  }
  unsubscribe = async (topic: string, connectionId: string) => {
    /* stub */
  }
  broadcast = async (
    topic: string,
    connectionId: string,
    data: Out,
    isBinary?: boolean
  ) => {
    /* stub */
  }
  onChannelClosed = async (channelId: string) => {
    /* stub */
  }
}

let handler: VrameworkChannelHandler<
  TestUserSession,
  { param: string },
  { msg: string }
>
let subscriptionService: SubscriptionService<{ msg: string }>
let broadcastFn: (fromChannelId: string, data: { msg: string }) => void

beforeEach(() => {
  subscriptionService = new MockSubscriptionService<{ msg: string }>()
  broadcastFn = () => {
    /* stub */
  }
  handler = new VrameworkChannelHandler<
    TestUserSession,
    { param: string },
    { msg: string }
  >('test-channel-id', { param: 'testParam' }, subscriptionService, broadcastFn)
})

test('getChannel should return a channel with initial state', () => {
  const channel = handler.getChannel()
  assert.equal(channel.channelId, 'test-channel-id', 'Channel ID should match')
  assert.equal(channel.state, 'initial', 'Initial state should be "initial"')
  assert.equal(
    channel.openingData.param,
    'testParam',
    'Opening data should be accessible'
  )
  assert.equal(
    channel.session,
    undefined,
    'Session should initially be undefined'
  )
  assert.equal(
    channel.subscriptions,
    subscriptionService,
    'Subscriptions should match the provided service'
  )
})

test('setSession should update the channel session', () => {
  const channel = handler.getChannel()
  handler.setSession({ userId: 'user123' })
  assert.equal(
    channel.session?.userId,
    'user123',
    'Session userId should be updated'
  )
})

test('open should change channel state to open and call open callback', async () => {
  let openCalled = false
  handler.registerOnOpen(async () => {
    openCalled = true
  })

  handler.open()

  const channel = handler.getChannel()
  assert.equal(
    channel.state,
    'open',
    'State should be "open" after calling open()'
  )
  assert.equal(openCalled, true, 'Open callback should have been called')
})

test('message should call the registered onMessage callback', () => {
  let receivedMessage: unknown = null
  handler.registerOnMessage((msg) => {
    receivedMessage = msg
  })

  handler.message({ hello: 'world' })

  assert.deepEqual(
    receivedMessage,
    { hello: 'world' },
    'onMessage callback should receive the sent message'
  )
})

test('close should change channel state to closed and call close callback', async () => {
  let closeCalled = false
  handler.registerOnClose(async () => {
    closeCalled = true
  })

  handler.close()

  const channel = handler.getChannel()
  assert.equal(
    channel.state,
    'closed',
    'State should be "closed" after calling close()'
  )
  assert.equal(closeCalled, true, 'Close callback should have been called')
})

test('send should throw if send callback is not registered', () => {
  const channel = handler.getChannel()

  assert.throws(
    () => channel.send({ msg: 'test' }),
    /No send callback registered/,
    'Should throw an error if no send callback is registered'
  )
})

test('send should call the registered send callback', () => {
  let sentMessage: { msg: string } | null = null

  handler.registerOnSend((message) => {
    sentMessage = message
  })

  const channel = handler.getChannel()
  channel.send({ msg: 'hello' })

  assert.deepEqual(
    sentMessage,
    { msg: 'hello' },
    'Send callback should receive the message'
  )
})

test('broadcast should call the provided broadcast function', () => {
  let fromId: string | null = null
  let broadcastMessage: { msg: string } | null = null

  const localHandler = new VrameworkChannelHandler<
    TestUserSession,
    { param: string },
    { msg: string }
  >(
    'broadcast-channel-id',
    { param: 'abc' },
    subscriptionService,
    (fId, data) => {
      fromId = fId
      broadcastMessage = data
    }
  )

  const channel = localHandler.getChannel()
  channel.broadcast({ msg: 'broadcast test' })

  assert.equal(
    fromId,
    'broadcast-channel-id',
    'Should pass the channel ID to broadcast callback'
  )
  assert.deepEqual(
    broadcastMessage,
    { msg: 'broadcast test' },
    'Should pass the correct broadcast message'
  )
})
