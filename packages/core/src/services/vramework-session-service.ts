import { InvalidSessionError, MissingSessionError } from "../errors"
import { AuthenticationService, SessionService } from "../services"
import { parse as parseCookie } from 'cookie'
import { URL } from 'url'

export class VrameworkSessionService<UserSession> implements SessionService<UserSession> {
    constructor(
        private authService: AuthenticationService<UserSession>, 
        private options: {
            transformSession?: (session: any) => Promise<UserSession>
        }
    ) {
    }

    public getCookieName(headers: Record<string, string>): string {
        const origin = headers.origin
        if (origin) {
            const url = new URL(headers.origin)
            return url.port !== '80' && url.port !== '443' ? url.host : `${url.host}:${url.port}`
        }
        return 'localhost' // default cookie name
    }

    public async getUserSession(credentialsRequired: boolean, headers: Record<string, string>, debug?: any) {
        let apiKeySession: UserSession | null = null
        let authorizationSession: UserSession | null = null
        let cookieSession: UserSession | null = null

        const apiKey = headers['x-api-key']
        if (apiKey) {
            return await this.authService.getSessionForAPIKey(apiKey)
        }

        const authorization = headers.authorization || headers.Authorization
        if (authorization) {
            if (authorization.split(' ')[0] !== 'Bearer') {
                throw new InvalidSessionError()
            }
            authorizationSession = await this.authService.decodeSession(authorization.split(' ')[1])
        }

        if (headers.cookie) {
            const cookie = parseCookie(headers.cookie)
            const jwt = cookie[this.getCookieName(headers)]
            if (jwt) {
                cookieSession = await this.authService.decodeSession(authorization.split(' ')[1])
            }
        }

        if (apiKeySession || authorizationSession || cookieSession) {
            if (this.options.transformSession) {
                return await this.options.transformSession({
                    ...(apiKeySession || {}),
                    ...(authorizationSession || {}),
                    ...(cookieSession || {}),
                } as UserSession)
            }

            return {
                ...(apiKeySession || {}),
                ...(authorizationSession || {}),
                ...(cookieSession || {}),
            } as UserSession
        }

        if (credentialsRequired) {
            throw new MissingSessionError()
        }

        return undefined
    }
}