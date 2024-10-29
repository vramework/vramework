import * as sinon from 'sinon'
import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
chai.use(
  'default' in chaiAsPromised ? chaiAsPromised.default : (chaiAsPromised as any)
)

import { VrameworkSessionService } from './vramework-session-service.js'
import { InvalidSessionError, MissingSessionError } from '../errors.js'

describe('VrameworkSessionService', () => {
  let sessionServiceOptions: any
  let sessionService: VrameworkSessionService<any>
  let jwtService: any
  let request: any

  beforeEach(() => {
    jwtService = {
      decode: sinon.stub(),
    } as any

    sessionServiceOptions = {
      cookieNames: ['session'],
      getSessionForCookieValue: sinon.stub(),
      getSessionForAPIKey: sinon.stub(),
    }
    sessionService = new VrameworkSessionService(
      jwtService,
      sessionServiceOptions
    )

    request = {
      getCookies: sinon.stub(),
      getHeader: sinon.stub(),
    } as any
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('getUserSession', () => {
    it('should return undefined when no credentials are provided and not required', async () => {
      const session = await sessionService.getUserSession(false, request)
      expect(session).to.be.undefined
    })

    it('should throw MissingSessionError when no credentials are provided and required', async () => {
      await expect(
        sessionService.getUserSession(true, request)
      ).to.be.rejectedWith(MissingSessionError)
    })

    it('should decode JWT token from Authorization header', async () => {
      const mockSession = { id: '123' }
      request.getHeader.withArgs('authorization').returns('Bearer token123')
      jwtService.decode.resolves(mockSession)

      const session = await sessionService.getUserSession(true, request)

      expect(session).to.deep.equal(mockSession)
      expect(jwtService.decode.calledWith('token123')).to.be.true
    })

    it('should throw InvalidSessionError for non-Bearer Authorization header', async () => {
      request.getHeader.withArgs('authorization').returns('Basic token123')

      await expect(
        sessionService.getUserSession(true, request)
      ).to.be.rejectedWith(InvalidSessionError)
    })

    it('should get session from API key', async () => {
      const mockSession = { id: '456' }
      request.getHeader.withArgs('x-api-key').returns('apikey123')
      sessionServiceOptions.getSessionForAPIKey!.resolves(mockSession)

      const session = await sessionService.getUserSession(true, request)

      expect(session).to.deep.equal(mockSession)
      expect(sessionServiceOptions.getSessionForAPIKey!.calledWith('apikey123'))
        .to.be.true
    })

    it('should get session from cookie', async () => {
      const mockSession = { id: '789' }
      request.getCookies.returns({ session: 'cookie123' })
      sessionServiceOptions.getSessionForCookieValue!.resolves(mockSession)

      const session = await sessionService.getUserSession(true, request)

      expect(session).to.deep.equal(mockSession)
      expect(
        sessionServiceOptions.getSessionForCookieValue!.calledWith(
          'cookie123',
          'session'
        )
      ).to.be.true
    })

    it('should transform session if transformer is provided', async () => {
      const mockSession = { id: '123' }
      const transformedSession = { id: '123', extra: 'data' }
      request.getHeader.withArgs('authorization').returns('Bearer token123')
      jwtService.decode.resolves(mockSession)
      sessionServiceOptions.transformSession = sinon.stub()
      sessionServiceOptions.transformSession!.resolves(transformedSession)

      const session = await sessionService.getUserSession(true, request)

      expect(session).to.deep.equal(transformedSession)
      expect(sessionServiceOptions.transformSession!.calledWith(mockSession)).to
        .be.true
    })
  })
})
