import { test, beforeEach, afterEach } from 'node:test'
import * as assert from 'node:assert/strict'
import { LocalSubscriptionService } from './local-subscription-service.js'
import { getOpenChannels } from './local-channel-runner.js'

test('subscribe should add a connection to a topic', async () => {
  const service = new LocalSubscriptionService()
  await service.subscribe('topicA', 'conn1')

  // Subscribe another connection to the same topic
  await service.subscribe('topicA', 'conn2')

  const openChannels = getOpenChannels()
  openChannels.set('conn1', {
    send: (data: unknown) => {
      /* stub */
    },
  } as any)

  let sentToConn2 = false
  openChannels.set('conn2', {
    send: (data: unknown) => {
      sentToConn2 = true
    },
  } as any)

  // Broadcast from conn1, so conn1 should not receive it, conn2 should receive it
  await service.broadcast('topicA', 'conn1', { msg: 'hello' })

  assert.equal(sentToConn2, true, 'conn2 should receive the broadcast')
})

test('unsubscribe should remove connection from topic', async () => {
  const service = new LocalSubscriptionService()
  await service.subscribe('topicB', 'conn3')
  await service.subscribe('topicB', 'conn4')

  const openChannels = getOpenChannels()
  openChannels.set('conn3', {
    send: (data: unknown) => {
      /* stub */
    },
  } as any)
  openChannels.set('conn4', {
    send: (data: unknown) => {
      /* stub */
    },
  } as any)

  // Unsubscribe conn4
  await service.unsubscribe('topicB', 'conn4')

  let sentToConn3 = false
  let sentToConn4 = false

  // Replace the mocks with spies
  openChannels.set('conn3', {
    send: (data: unknown) => {
      sentToConn3 = true
    },
  } as any)
  openChannels.set('conn4', {
    send: (data: unknown) => {
      sentToConn4 = true
    },
  } as any)

  // Broadcast from conn3
  await service.broadcast('topicB', 'conn3', { msg: 'test' })

  // After unsubscribe, only conn3 is subscribed. It shouldn't receive its own broadcast.
  assert.equal(sentToConn3, false, 'conn3 should not receive its own broadcast')
  assert.equal(
    sentToConn4,
    false,
    'conn4 is unsubscribed and should not receive anything'
  )
})

test('broadcast should skip sender and send to others', async () => {
  const service = new LocalSubscriptionService()
  await service.subscribe('topicC', 'conn5')
  await service.subscribe('topicC', 'conn6')

  const openChannels = getOpenChannels()
  openChannels.set('conn5', {
    send: () => {
      /* sender, should not receive message */
    },
  } as any)

  let receivedByConn6 = false
  openChannels.set('conn6', {
    send: (data: unknown) => {
      receivedByConn6 = true
    },
  } as any)

  await service.broadcast('topicC', 'conn5', { msg: 'hello conn6' })
  assert.equal(
    receivedByConn6,
    true,
    'conn6 should receive broadcast from conn5'
  )
})

test('onChannelClosed should remove channel from all topics', async () => {
  const service = new LocalSubscriptionService()
  await service.subscribe('topicD', 'conn7')
  await service.subscribe('topicD', 'conn8')
  await service.subscribe('topicE', 'conn7')

  const openChannels = getOpenChannels()
  openChannels.set('conn7', { send: () => {} } as any)
  openChannels.set('conn8', { send: () => {} } as any)

  // Close conn7
  await service.onChannelClosed('conn7')

  let sentToConn7 = false
  let sentToConn8 = false

  openChannels.set('conn7', {
    send: () => {
      sentToConn7 = true
    },
  } as any)
  openChannels.set('conn8', {
    send: () => {
      sentToConn8 = true
    },
  } as any)

  // Now broadcast on topicD from conn8
  await service.broadcast('topicD', 'conn8', { msg: 'test' })

  // conn7 was removed from all topics, and conn8 shouldn't receive its own broadcast.
  assert.equal(
    sentToConn7,
    false,
    'conn7 should have been removed and receive nothing'
  )
  assert.equal(sentToConn8, false, 'conn8 should not receive its own broadcast')
})

beforeEach(() => {
  // Clear and reset any global state before each test, if needed
  const openChannels = getOpenChannels()
  openChannels.clear()
})

afterEach(() => {
  // Cleanup after each test
  const openChannels = getOpenChannels()
  openChannels.clear()
})
