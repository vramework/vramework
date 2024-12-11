import { HTTPSessionService } from './http-session-service.js'
import { JWTService } from '../services/jwt-service.js'
import { InvalidSessionError, MissingSessionError } from '../errors/errors.js'
import { VrameworkHTTPAbstractRequest } from './vramework-http-abstract-request.js'

/**
 * The `VrameworkHTTPSessionService` class provides session management capabilities, including handling JWT-based sessions,
 * cookie-based sessions, and API key-based sessions. It allows for retrieving and transforming user sessions based on different
 * authentication mechanisms.
 *
 * @template UserSession - The type representing a user session.
 */
export class VrameworkHTTPSessionService<UserSession>
  implements HTTPSessionService<UserSession>
{
  /**
   * Constructs a new instance of the `VrameworkHTTPSessionService` class.
   *
   * @param jwtService - The service for handling JWT operations.
   * @param options - Options for configuring the session service.
   */
  constructor(
    private jwtService: JWTService<UserSession>,
    private options: {
      cookieNames?: string[]
      getSessionForCookieValue?: (
        cookieValue: string,
        cookieName: string
      ) => Promise<UserSession>
      getSessionForQueryValue?: (queryValue: unknown) => Promise<UserSession>
      getSessionForAPIKey?: (apiKey: string) => Promise<UserSession>
      transformSession?: (session: any) => Promise<UserSession>
    }
  ) {}

  /**
   * Retrieves a session from cookies if available.
   *
   * @param request - The request object containing cookies.
   * @returns A promise that resolves to the user session, or `undefined` if no session is found.
   */
  private async getCookieSession(
    request: VrameworkHTTPAbstractRequest
  ): Promise<UserSession | undefined> {
    const cookies = request.getCookies()
    if (!cookies) {
      return
    }

    let cookieName: string | undefined
    if (this.options.cookieNames) {
      for (const name of this.options.cookieNames) {
        if (cookies[name]) {
          cookieName = name
        }
      }
    }

    if (!cookieName) {
      return
    }

    const cookieValue = cookies[cookieName]
    if (!cookieValue) {
      return
    }

    if (!this.options.getSessionForCookieValue) {
      return
    }

    return await this.options.getSessionForCookieValue(cookieValue, cookieName)
  }

  /**
   * Retrieves the user session based on available credentials (JWT, API key, or cookies).
   *
   * @param credentialsRequired - Whether credentials are required to proceed.
   * @param request - The request object containing headers and cookies.
   * @param debugJWTDecode - Whether to enable debugging for JWT decoding.
   * @returns A promise that resolves to the user session, or `undefined` if no session is found and credentials are not required.
   * @throws {MissingSessionError} - Throws an error if credentials are required but no session is found.
   */
  public async getUserSession(
    credentialsRequired: boolean,
    request: VrameworkHTTPAbstractRequest,
    debugJWTDecode?: boolean
  ): Promise<UserSession | undefined> {
    let userSession: UserSession | undefined

    const authorization =
      request.getHeader('authorization') || request.getHeader('Authorization')
    if (authorization) {
      const [part1, part2] = authorization.split(' ')
      if (part1 !== 'Bearer' || !part2) {
        throw new InvalidSessionError()
      }
      userSession = await this.jwtService.decode(
        part2,
        undefined,
        debugJWTDecode
      )
    }

    if (!userSession && this.options.getSessionForAPIKey) {
      const apiKey = request.getHeader('x-api-key')
      if (apiKey) {
        userSession = await this.options.getSessionForAPIKey(apiKey)
      }
    }

    if (!userSession && this.options.getSessionForCookieValue) {
      userSession = await this.getCookieSession(request)
    }

    if (!userSession && this.options.getSessionForQueryValue) {
      userSession = await this.options.getSessionForQueryValue(
        request.getQuery()
      )
    }

    if (!userSession && credentialsRequired) {
      throw new MissingSessionError()
    }

    if (userSession && this.options.transformSession) {
      return await this.options.transformSession(userSession)
    }

    return userSession
  }
}
