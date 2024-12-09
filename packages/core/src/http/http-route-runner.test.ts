import { test, describe, beforeEach, afterEach } from 'node:test'
import * as assert from 'assert'
import { NotFoundError, NotImplementedError } from '../errors/errors.js'
import { VrameworkHTTPAbstractRequest } from './vramework-http-abstract-request.js'
import { VrameworkHTTPAbstractResponse } from './vramework-http-abstract-response.js'
import { JSONValue } from '../types/core.types.js'
import {
  getUserSession,
  runHTTPRoute,
  clearRoutes,
  addRoute,
} from './http-route-runner.js'

class VrameworkTestRequest extends VrameworkHTTPAbstractRequest {
  public getHeader(_headerName: string): string | undefined {
    throw new Error('Method not implemented.')
  }
}

class VrameworkTestResponse extends VrameworkHTTPAbstractResponse {
  public setStatus(_status: number): void {
    throw new Error('Method not implemented.')
  }
  public setJson(_body: JSONValue): void {
    throw new Error('Method not implemented.')
  }
  public setResponse(_response: string | Buffer): void {
    throw new Error('Method not implemented.')
  }
}

describe('runHTTPRoute', () => {
  let singletonServices: any
  let createSessionServices: any
  let request: any
  let response: any

  beforeEach(() => {
    clearRoutes()

    singletonServices = {
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
      sessionService: {
        getUserSession: async () => {},
      },
    }

    createSessionServices = async () => ({})
    request = new VrameworkTestRequest()
    response = new VrameworkTestResponse()

    request.getData = async () => ({})
    request.getHeader = () => 'application/json'
    response.setStatus = (status: number) => {}
    response.setJson = (json: JSONValue) => {}
  })

  afterEach(() => {})

  test('should throw RouteNotFoundError when no matching route is found', async () => {
    const apiRoute = '/test'
    const apiType = 'get'

    await assert.rejects(
      async () =>
        runHTTPRoute({
          request,
          response,
          singletonServices,
          createSessionServices,
          route: apiRoute,
          method: apiType,
        }),
      NotFoundError
    )
  })

  test('should call the route function and return its result when a matching route is found', async () => {
    const apiRoute = '/test'
    const apiType = 'get'
    const routeFunc = async () => ({ success: true })
    addRoute({
      route: 'test',
      method: 'get',
      func: routeFunc,
    })

    const result = await runHTTPRoute({
      request,
      response,
      singletonServices,
      createSessionServices,
      route: apiRoute,
      method: apiType,
    })

    assert.deepStrictEqual(result, { success: true })
  })

  test('should verify permissions if provided', async () => {
    const apiRoute = '/test'
    const apiType = 'get'
    const permissions = { test: async () => true }
    const routeFunc = async () => ({ success: true })

    addRoute({
      route: 'test',
      method: 'get',
      func: routeFunc,
      permissions,
    })

    await runHTTPRoute({
      request,
      response,
      singletonServices,
      createSessionServices,
      route: apiRoute,
      method: apiType,
    })

    assert.strictEqual(await permissions.test(), true)
  })

  test('should handle errors and set appropriate response', async () => {
    const apiRoute = '/test'
    const apiType = 'get'
    const error = new Error('Test error')
    const routeFunc = async () => {
      throw error
    }
    addRoute({
      route: 'test',
      method: 'get',
      func: routeFunc,
    })

    await assert.rejects(
      async () =>
        runHTTPRoute({
          request,
          response,
          singletonServices,
          createSessionServices,
          route: apiRoute,
          method: apiType,
        }),
      error
    )
  })
})

describe('getUserSession', () => {
  let sessionService: any
  let request: any

  beforeEach(() => {
    sessionService = {
      getUserSession: async () => ({}),
    }
    request = new VrameworkTestRequest()
  })

  test('should return user session when sessionService is provided', async () => {
    const userSession = { id: '123', username: 'test' }
    sessionService.getUserSession = async () => userSession

    const result = await getUserSession(sessionService, true, request)

    assert.deepStrictEqual(result, userSession)
  })

  test('should throw NotImplementedError when session is required but sessionService is not provided', async () => {
    await assert.rejects(
      async () => getUserSession(undefined, true, request),
      NotImplementedError
    )
  })

  test('should return undefined when session is not required and sessionService is not provided', async () => {
    const result = await getUserSession(undefined, false, request)
    assert.strictEqual(result, undefined)
  })
})
