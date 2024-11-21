import { beforeEach, test, describe, afterEach, mock } from 'node:test';
import assert from 'assert';
import { VrameworkSessionService } from './vramework-session-service.js';
import { InvalidSessionError, MissingSessionError } from '../errors.js';

describe('VrameworkSessionService', () => {
  let sessionServiceOptions: any;
  let sessionService: VrameworkSessionService<any>;
  let jwtService: any;
  let request: any;

  beforeEach(() => {
    jwtService = mock.fn().mockImplementation(() => ({
      decode: mock.fn(),
    }))();

    sessionServiceOptions = {
      cookieNames: ['session'],
      getSessionForCookieValue: mock.fn(),
      getSessionForAPIKey: mock.fn(),
    };

    sessionService = new VrameworkSessionService(jwtService, sessionServiceOptions);

    request = mock.fn().mockImplementation(() => ({
      getCookies: mock.fn(),
      getHeader: mock.fn(),
    }))();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('getUserSession', () => {
    test('should return undefined when no credentials are provided and not required', async () => {
      const session = await sessionService.getUserSession(false, request);
      assert.strictEqual(session, undefined);
    });

    test('should throw MissingSessionError when no credentials are provided and required', async () => {
      await assert.rejects(
        async () => sessionService.getUserSession(true, request),
        MissingSessionError
      );
    });

    test('should decode JWT token from Authorization header', async () => {
      const mockSession = { id: '123' };
      request.getHeader.mockReturnValueOnce('Bearer token123');
      jwtService.decode.mockResolvedValueOnce(mockSession);

      const session = await sessionService.getUserSession(true, request);

      assert.deepStrictEqual(session, mockSession);
      assert.strictEqual(jwtService.decode.mock.calls.length, 1);
      assert.strictEqual(jwtService.decode.mock.calls[0][0], 'token123');
    });

    test('should throw InvalidSessionError for non-Bearer Authorization header', async () => {
      request.getHeader.mockReturnValueOnce('Basic token123');

      await assert.rejects(
        async () => sessionService.getUserSession(true, request),
        InvalidSessionError
      );
    });

    test('should get session from API key', async () => {
      const mockSession = { id: '456' };
      request.getHeader.mockReturnValueOnce('apikey123');
      sessionServiceOptions.getSessionForAPIKey.mockResolvedValueOnce(mockSession);

      const session = await sessionService.getUserSession(true, request);

      assert.deepStrictEqual(session, mockSession);
      assert.strictEqual(sessionServiceOptions.getSessionForAPIKey.mock.calls.length, 1);
      assert.strictEqual(sessionServiceOptions.getSessionForAPIKey.mock.calls[0][0], 'apikey123');
    });

    test('should get session from cookie', async () => {
      const mockSession = { id: '789' };
      request.getCookies.mockReturnValueOnce({ session: 'cookie123' });
      sessionServiceOptions.getSessionForCookieValue.mockResolvedValueOnce(mockSession);

      const session = await sessionService.getUserSession(true, request);

      assert.deepStrictEqual(session, mockSession);
      assert.strictEqual(sessionServiceOptions.getSessionForCookieValue.mock.calls.length, 1);
      const [cookieValue, cookieName] = sessionServiceOptions.getSessionForCookieValue.mock.calls[0];
      assert.strictEqual(cookieValue, 'cookie123');
      assert.strictEqual(cookieName, 'session');
    });

    test('should transform session if transformer is provided', async () => {
      const mockSession = { id: '123' };
      const transformedSession = { id: '123', extra: 'data' };
      request.getHeader.mockReturnValueOnce('Bearer token123');
      jwtService.decode.mockResolvedValueOnce(mockSession);
      sessionServiceOptions.transformSession = mock.fn();
      sessionServiceOptions.transformSession.mockResolvedValueOnce(transformedSession);

      const session = await sessionService.getUserSession(true, request);

      assert.deepStrictEqual(session, transformedSession);
      assert.strictEqual(sessionServiceOptions.transformSession.mock.calls.length, 1);
      assert.deepStrictEqual(sessionServiceOptions.transformSession.mock.calls[0][0], mockSession);
    });
  });
});
