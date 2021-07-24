import { InvalidSessionError, MissingSessionError } from "../../errors"
import { JWTService, SessionService } from "../../services"
import { parse as parseCookie } from 'cookie'
import { URL } from 'url'

export class VrameworkSessionService<UserSession> implements SessionService<UserSession> {
    constructor(private jwtService: JWTService<UserSession>, private getSessionForAPIKey: (apiKey: string) => Promise<UserSession>) {
    }

    public getCookieName(headers: Record<string, string>): string {
        const origin = headers.origin
        if (origin) {
            const url = new URL(headers.origin)
            return url.host
        }
        return 'localhost' // default cookie name
    }

    public async getUserSession(credentialsRequired: boolean, headers: Record<string, string>, debug?: any) {
        let apiKeySession: UserSession | null = null
        let authorizationSession: UserSession | null = null
        let cookieSession: UserSession | null = null

        const apiKey = headers['x-api-key']
        if (apiKey) {
            apiKeySession = await this.getSessionForAPIKey(apiKey)
        }

        const authorization = headers.authorization || headers.Authorization
        if (authorization) {
            if (authorization.split(' ')[0] !== 'Bearer') {
                throw new InvalidSessionError()
            }
            authorizationSession = await this.jwtService.decodeSessionAsync(authorization.split(' ')[1], debug)
        }

        if (headers.cookie) {
            const cookie = parseCookie(headers.cookie)
            const jwt = cookie[this.getCookieName(headers)]
            if (jwt) {
                cookieSession = await this.jwtService.decodeSessionAsync(jwt, debug)
            }
        }

        if (apiKeySession || authorizationSession || cookieSession) {
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