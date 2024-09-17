import { JWTService, SessionService } from '@vramework/core/services'
import { InvalidSessionError, MissingSessionError } from '../core/errors'
import { VrameworkRequest } from '../core/vramework-request'

export class VrameworkSessionService<UserSession>
  implements SessionService<UserSession>
{
  constructor(
    private jwtService: JWTService<UserSession>,
    private options: {
      cookieNames?: string[]
      getSessionForCookieValue?: (
        cookieValue: string,
        cookieName: string
      ) => Promise<UserSession>
      getSessionForAPIKey?: (apiKey: string) => Promise<UserSession>
      transformSession?: (session: any) => Promise<UserSession>
    }
  ) {}

  private async getCookieSession(
    request: VrameworkRequest
  ): Promise<UserSession | null> {
    const cookies = request.getCookies()
    if (!cookies) {
      return null
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
      return null
    }

    const cookieValue = cookies[cookieName]
    if (!cookieValue) {
      return null
    }

    if (!this.options.getSessionForCookieValue) {
      return null
    }

    return await this.options.getSessionForCookieValue(cookieValue, cookieName)
  }

  public async getUserSession(
    credentialsRequired: boolean,
    request: VrameworkRequest,
    debugJWTDecode?: boolean
  ): Promise<UserSession | undefined> {
    let userSession: UserSession | null = null

    const authorization =
      request.getHeader('authorization') || request.getHeader('Authorization')
    if (authorization) {
      if (authorization.split(' ')[0] !== 'Bearer') {
        throw new InvalidSessionError()
      }
      userSession = await this.jwtService.decode(
        authorization.split(' ')[1],
        undefined,
        debugJWTDecode
      )
    }

    if (this.options.getSessionForAPIKey) {
      const apiKey = request.getHeader('x-api-key')
      if (apiKey) {
        userSession = await this.options.getSessionForAPIKey(apiKey)
      }
    }

    if (this.options.getSessionForCookieValue) {
      userSession = await this.getCookieSession(request)
    }

    if (userSession) {
      if (this.options.transformSession) {
        return await this.options.transformSession(userSession)
      }
      return userSession
    }

    if (credentialsRequired) {
      throw new MissingSessionError()
    }

    return undefined
  }
}
