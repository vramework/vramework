import { test, beforeEach, afterEach } from 'node:test'
import * as assert from 'node:assert/strict'
import { getOpenChannels, runChannel } from './channel-runner.js'
import { JSONValue } from '../types/core.types.js'
import { VrameworkHTTPAbstractRequest } from '../http/vramework-http-abstract-request.js'
import { VrameworkHTTPAbstractResponse } from '../http/vramework-http-abstract-response.js'

/**
 * Minimal stubs for dependencies that runChannel expects.
 * In a real test setup, you may provide more comprehensive mocks
 * or refactor your code to allow dependency injection.
 */
const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
}

const mockSingletonServices = {
  logger: mockLogger,
  // Provide a mock channelPermissionService only when needed
  // e.g., channelPermissionService: { verifyChannelAccess: async () => {} },
  httpSessionService: {},
} as any

// Mock request and response objects
class MockRequest extends VrameworkHTTPAbstractRequest {
  public getHeader(headerName: string): string | undefined {
    throw new Error('Method not implemented.')
  }
  public async getData() {
    return { test: 'data' }
  }
}

class MockResponse extends VrameworkHTTPAbstractResponse {
  public statusSet: boolean | undefined
  public ended: boolean | undefined

  public setJson(body: JSONValue): void {
    throw new Error('Method not implemented.')
  }
  public setResponse(response: string | Buffer): void {
    throw new Error('Method not implemented.')
  }
  public setStatus(code) {
    console.log('here', code)
    this.statusSet = code
  }
  public end() {
    this.ended = true
  }
}

const mockCreateSessionServices = async () => ({ sessionServiceMock: true })
const mockSubscriptionService = {} as any

function resetGlobalChannels(channels: any[] = [], channelsMeta: any[] = []) {
  // If necessary, reinitialize globalThis.vramework
  if (!globalThis.vramework) {
    globalThis.vramework = {}
  }
  globalThis.vramework.channels = channels
  globalThis.vramework.channelsMeta = channelsMeta
  globalThis.vramework.openChannels = new Map()
}

beforeEach(() => {
  resetGlobalChannels()
})

afterEach(() => {
  resetGlobalChannels()
})

test('runChannel should return undefined and 404 if no matching channel is found', async () => {
  // No channels configured
  resetGlobalChannels()

  const mockResponse = new MockResponse()

  const result = await runChannel({
    singletonServices: mockSingletonServices,
    channelId: 'test-channel-id',
    request: new MockRequest(),
    response: mockResponse,
    channel: '/non-existent-channel',
    createSessionServices: mockCreateSessionServices,
    subscriptionService: mockSubscriptionService,
  })

  assert.equal(
    result,
    undefined,
    'Should return undefined if no channel matches'
  )
  assert.equal(mockResponse.statusSet, 404, 'Should set response status to 404')
  assert.equal(mockResponse.ended, true, 'Should end the response')
})

test('runChannel should return a channel handler if channel matches and no auth required', async () => {
  resetGlobalChannels([
    {
      channel: '/test-channel',
      auth: false,
    },
  ])

  // Provide a fake channelPermissionService if needed
  const singletonServicesWithPerm = {
    ...mockSingletonServices,
    channelPermissionService: {
      verifyChannelAccess: async () => {},
    },
  }

  const result = await runChannel({
    singletonServices: singletonServicesWithPerm,
    channelId: 'test-channel-id',
    request: new MockRequest(),
    response: new MockResponse(),
    channel: '/test-channel',
    createSessionServices: mockCreateSessionServices,
    subscriptionService: mockSubscriptionService,
  })

  assert.ok(result, 'Should return a VrameworkChannelHandler instance')
  const openChannels = getOpenChannels()
  assert.equal(
    openChannels.size,
    0,
    'Channel should not be open until onOpen is called'
  )

  // Simulate opening the channel
  result.open()
  assert.equal(
    openChannels.size,
    1,
    'Channel should be added to open channels after open is called'
  )
  assert.ok(
    openChannels.has('test-channel-id'),
    'Should have the opened channel in openChannels'
  )
})
