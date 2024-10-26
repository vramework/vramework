import * as sinon from 'sinon'
import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
chai.use('default' in chaiAsPromised ? chaiAsPromised.default : chaiAsPromised as any)

import { NotImplementedError, RouteNotFoundError } from './errors.js'
import { VrameworkRequest } from './vramework-request.js'
import { VrameworkResponse } from './vramework-response.js'
import { JSONValue } from './types/core.types.js'
import {
  getUserSession,
  runRoute,
  clearRoutes,
  addRoute,
} from './route-runner.js'

class VrameworkTestRequest extends VrameworkRequest {
  public getHeader(_headerName: string): string | undefined {
    throw new Error('Method not implemented.')
  }
}

class VrameworkTestResponse extends VrameworkResponse {
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

describe('runRoute', () => {
  let services, createSessionServices, request, response

  beforeEach(() => {
    clearRoutes()

    services = {
      logger: {
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
      },
      sessionService: {
        getUserSession: sinon.stub(),
      },
    }
    createSessionServices = sinon.stub().resolves({})
    request = new VrameworkTestRequest()
    response = new VrameworkTestResponse()

    sinon.stub(request, 'getData').resolves({})
    sinon.stub(request, 'getHeader').returns('application/json')
    sinon.stub(request, 'setParams')
    sinon.stub(response, 'setStatus')
    sinon.stub(response, 'setJson')
    sinon.stub(response, 'setResponse')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should throw RouteNotFoundError when no matching route is found', async () => {
    const apiRoute = '/test'
    const apiType = 'get'

    await expect(
      runRoute(request, response, services, createSessionServices, {
        route: apiRoute,
        method: apiType,
      })
    ).to.be.rejectedWith(RouteNotFoundError)
  })

  it('should call the route function and return its result when a matching route is found', async () => {
    const apiRoute = '/test'
    const apiType = 'get'
    const routeFunc = sinon.stub().resolves({ success: true })
    addRoute({
      route: 'test',
      method: 'get',
      func: routeFunc,
    })

    const result = await runRoute(
      request,
      response,
      services,
      createSessionServices,
      { route: apiRoute, method: apiType }
    )

    expect(result).to.deep.equal({ success: true })
    expect(routeFunc.calledOnce).to.be.true
    expect(response.setStatus.calledWith(200)).to.be.true
    expect(response.setJson.calledWith({ success: true })).to.be.true
  })

  it('should verify permissions if provided', async () => {
    const apiRoute = '/test'
    const apiType = 'get'
    const permissions = { test: sinon.stub().resolves(true) }
    const routeFunc = sinon.stub().resolves({ success: true })
    addRoute({
      route: 'test',
      method: 'get',
      func: routeFunc,
      permissions,
    })

    await runRoute(request, response, services, createSessionServices, {
      route: apiRoute,
      method: apiType,
    })

    expect(permissions.test.calledOnce).to.be.true
  })

  it('should handle errors and set appropriate response', async () => {
    const apiRoute = '/test'
    const apiType = 'get'
    const error = new Error('Test error')
    const routeFunc = sinon.stub().rejects(error)
    addRoute({
      route: 'test',
      method: 'get',
      func: routeFunc,
    })

    await expect(
      runRoute(request, response, services, createSessionServices, {
        route: apiRoute,
        method: apiType,
      })
    ).to.be.rejectedWith(Error, 'Test error')

    expect(response.setStatus.calledWith(500)).to.be.true
    expect(response.setJson.calledOnce).to.be.true
    expect(services.logger.error.calledOnce).to.be.true
  })
})

describe('getUserSession', () => {
  let sessionService, request

  beforeEach(() => {
    sessionService = {
      getUserSession: sinon.stub(),
    }
    request = new VrameworkTestRequest()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return user session when sessionService is provided', async () => {
    const userSession = { id: '123', username: 'test' }
    sessionService.getUserSession.resolves(userSession)

    const result = await getUserSession(sessionService, true, request)

    expect(result).to.deep.equal(userSession)
    expect(sessionService.getUserSession.calledWith(true, request)).to.be.true
  })

  it('should throw NotImplementedError when session is required but sessionService is not provided', async () => {
    await expect(getUserSession(undefined, true, request)).to.be.rejectedWith(
      NotImplementedError,
      'Session service not implemented'
    )
  })

  it('should return undefined when session is not required and sessionService is not provided', async () => {
    const result = await getUserSession(undefined, false, request)

    expect(result).to.be.undefined
  })
})
