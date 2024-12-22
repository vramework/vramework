import { test, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { CoreUserSession } from '../types/core.types.js';
import { SubscriptionService } from './subscription-service.js';
import { VrameworkAbstractChannelHandler } from './vramework-abstract-channel-handler.js';

// A concrete implementation of the abstract class for testing
class TestChannelHandler extends VrameworkAbstractChannelHandler<
  CoreUserSession,
  { param: string },
  { msg: string }
> {
  public async setUserSession(session: CoreUserSession): Promise<void> {
    this.userSession = session;
  }

  public async send(message: { msg: string }, isBinary = false): Promise<void> {
    // Mock send implementation
  }
}

// A stub subscription service for testing
class MockSubscriptionService<Out> implements SubscriptionService<Out> {
  publish = async (topic: string, channelId: string, data: Out, isBinary?: boolean) => {
     /* stub */
  }
  subscribe = async (topic: string, channelId: string) => {
    /* stub */
  };
  unsubscribe = async (topic: string, channelId: string) => {
    /* stub */
  };
  onChannelClosed = async (channelId: string) => {
    /* stub */
  };
}

let handler: TestChannelHandler;
let subscriptionService: MockSubscriptionService<{ msg: string }>;

beforeEach(() => {
  subscriptionService = new MockSubscriptionService<{ msg: string }>();
  handler = new TestChannelHandler(
    'test-channel-id',
    undefined,
    { param: 'testParam' },
    subscriptionService
  );
});

test('getChannel should return a channel with initial state', () => {
  const channel = handler.getChannel();
  assert.equal(channel.channelId, 'test-channel-id', 'Channel ID should match');
  assert.equal(channel.state, 'initial', 'Initial state should be "initial"');
  assert.deepEqual(
    channel.openingData,
    { param: 'testParam' },
    'Opening data should be accessible'
  );
  assert.equal(channel.userSession, undefined, 'Session should initially be undefined');
  assert.equal(
    channel.subscriptions,
    subscriptionService,
    'Subscriptions should match the provided service'
  );
});

test('setSession should update the channel session', async () => {
  const session = { userId: 'user123' } as CoreUserSession;
  await handler.setSession(session);
  const channel = handler.getChannel();
  assert.deepEqual(
    channel.userSession,
    session,
    'Session should be updated correctly'
  );
});

test('open should change channel state to open', () => {
  handler.open();
  const channel = handler.getChannel();
  assert.equal(channel.state, 'open', 'State should be "open" after calling open()');
});

test('close should change channel state to closed', () => {
  handler.close();
  const channel = handler.getChannel();
  assert.equal(channel.state, 'closed', 'State should be "closed" after calling close()');
});
