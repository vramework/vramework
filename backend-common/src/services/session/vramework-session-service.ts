import { InvalidSessionError, MissingSessionError } from "../../errors"
import { JWTService, SessionService } from "../../services"
import { parse as parseCookie } from 'cookie'
import { CoreConfig } from "../../config"

export class VrameworkSessionService<UserSession> implements SessionService<UserSession> {
    constructor (private config: CoreConfig, private jwtService: JWTService<UserSession>, private getSessionForAPIKey: (apiKey: string) => Promise<UserSession>) {
    }

    public async getUserSession (credentialsRequired: boolean, headers: Partial<Record<"cookie" | "authorization" | "apiKey", string | undefined>>, debug?: any) {
        let apiKeySession: UserSession | null = null
        let authorizationSession: UserSession | null = null
        let cookieSession: UserSession | null = null

        if (headers.apiKey) {
            apiKeySession = await this.getSessionForAPIKey(headers.apiKey)
        }

        if (headers.authorization) {
            if (headers.authorization.split(' ')[0] !== 'Bearer') {
                throw new InvalidSessionError()
            }
            authorizationSession = await this.jwtService.decodeSessionAsync(headers.authorization.split(' ')[1], debug)
        }

        if (headers.cookie) {
            const cookie = parseCookie(headers.cookie)
            const jwt = cookie[this.config.cookie.name]
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