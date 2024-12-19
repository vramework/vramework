import { test, beforeEach, afterEach, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { LocalSubscriptionService } from './local-subscription-service.js';
import { getOpenChannels } from './local-channel-runner.js';
import { SubscriptionService } from '../subscription-service.js';

function createConnection(channelId: string) {
  const receivedMessages: unknown[] = [];
  const openChannels = getOpenChannels();

  openChannels.set(channelId, {
    send: (data: unknown) => {
      receivedMessages.push(data);
    },
  } as any);

  return {
    channelId,
    receivedMessages,
    assertReceived(expected: unknown[], message?: string) {
      assert.deepEqual(
        receivedMessages,
        expected,
        message || `Expected to have received: ${JSON.stringify(expected)}`
      );
    },
    assertNotReceived(message?: string) {
      assert.equal(
        receivedMessages.length,
        0,
        message || `Expected to have received nothing, but got: ${JSON.stringify(receivedMessages)}`
      );
    },
    assertReceivedExactly(expected: unknown[], message?: string) {
      assert.deepEqual(
        receivedMessages,
        expected,
        message || `Expected exactly: ${JSON.stringify(expected)}, but got: ${JSON.stringify(receivedMessages)}`
      );
    },
  };
}

describe('LocalSubscriptionService', () => {
  beforeEach(() => {
    const openChannels = getOpenChannels();
    openChannels.clear();
  });

  afterEach(() => {
    const openChannels = getOpenChannels();
    openChannels.clear();
  });

  test('subscribe should add a connection to a topic', async () => {
    const service = new LocalSubscriptionService<any>();
    await service.subscribe('topicA', 'conn1');
    await service.subscribe('topicA', 'conn2');

    const con1 = createConnection('conn1');
    const con2 = createConnection('conn2');

    await service.publish('topicA', 'conn1', { msg: 'hello' });

    con1.assertNotReceived();
    con2.assertReceivedExactly([{ msg: 'hello' }]);
  });

  test('unsubscribe should remove connection from topic', async () => {
    const service: SubscriptionService<unknown> = new LocalSubscriptionService();
    await service.subscribe('topicB', 'conn3');
    await service.subscribe('topicB', 'conn4');

    await service.unsubscribe('topicB', 'conn4');

    const con3 = createConnection('conn3');
    const con4 = createConnection('conn4');

    await service.publish('topicB', 'conn3', { msg: 'test' });

    con3.assertNotReceived();
    con4.assertNotReceived();
  });

  test('broadcast should send to all channels except the sender', async () => {
    const service = new LocalSubscriptionService();
    await service.subscribe('topicC', 'conn5');
    await service.subscribe('topicC', 'conn6');

    const con5 = createConnection('conn5');
    const con6 = createConnection('conn6');

    await service.broadcast('conn5', { msg: 'hello conn6' });

    con5.assertNotReceived();
    con6.assertReceivedExactly([{ msg: 'hello conn6' }]);
  });

  test('publish should only send to subscribers of a topic', async () => {
    const service = new LocalSubscriptionService();
    await service.subscribe('topicD', 'conn7');
    await service.subscribe('topicD', 'conn8');
    await service.subscribe('topicE', 'conn9');

    const con7 = createConnection('conn7');
    const con8 = createConnection('conn8');
    const con9 = createConnection('conn9');

    await service.publish('topicD', 'conn7', { msg: 'test publish' });

    con7.assertNotReceived();
    con8.assertReceivedExactly([{ msg: 'test publish' }]);
    con9.assertNotReceived();
  });

  test('onChannelClosed should remove channel from all topics', async () => {
    const service = new LocalSubscriptionService();
    await service.subscribe('topicF', 'conn10');
    await service.subscribe('topicF', 'conn11');
    await service.subscribe('topicG', 'conn10');

    const con10 = createConnection('conn10');
    const con11 = createConnection('conn11');

    await service.onChannelClosed('conn10');

    await service.publish('topicF', 'conn11', { msg: 'test' });

    con10.assertNotReceived();
    con11.assertNotReceived();
  });
});
