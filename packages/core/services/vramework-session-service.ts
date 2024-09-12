import { InvalidSessionError, MissingSessionError } from "../errors"
import { JWTService, RequestHeaders, SessionService } from "../types"
import { parse as parseCookie } from 'cookie'
import { URL } from 'url'

export class VrameworkSessionService<UserSession> implements SessionService<UserSession> {
    constructor(
        private jwtService: JWTService<UserSession>,
        private options: {
            cookieNameIsOrigin?: boolean,
            cookieNames?: string[],
            getSessionForCookieValue?: (cookieValue: string, cookieName: string) => Promise<UserSession>,
            getSessionForAPIKey?: (apiKey: string) => Promise<UserSession>,
            transformSession?: (session: any) => Promise<UserSession>
        }
    ) {
    }

    private async getCookieSession(headers: RequestHeaders): Promise<UserSession | null> {
        const cookieHeader = this.getHeader(headers, 'cookie')
        if (!cookieHeader) {
            return null
        }

        const cookie = parseCookie(cookieHeader)
        let cookieName: string | undefined

        if (this.options.cookieNames) {
            for (const name of this.options.cookieNames) {
                if (cookie[name]) {
                    cookieName = name
                }
            }
        }

        if (!cookieName && this.options.cookieNameIsOrigin) {
            const origin = this.getHeader(headers, 'origin')
            const host = this.getHeader(headers, 'host')
            if (origin) {
                const url = new URL(origin)
                cookieName = url.port !== '80' && url.port !== '443' ? url.host : `${url.host}:${url.port}`
            }
            else if (host) {
                cookieName = host
            }

            // default cookie name
            cookieName = 'localhost'
        }

        if (!cookieName || !cookie[cookieName]) {
            return null
        }

        if (!this.options.getSessionForCookieValue) {
            return null
        }

        return await this.options.getSessionForCookieValue(cookie[cookieName], cookieName)
    }

    public async getUserSession(credentialsRequired: boolean, headers: RequestHeaders, debugJWTDecode?: boolean): Promise<UserSession | undefined> {
        let userSession: UserSession | null = null

        const authorization = this.getHeader(headers, 'authorization') || this.getHeader(headers, 'Authorization')
        if (authorization) {
            if (authorization.split(' ')[0] !== 'Bearer') {
                throw new InvalidSessionError()
            }
            userSession = await this.jwtService.decodeSessionAsync(authorization.split(' ')[1], debugJWTDecode)
        }

        if (this.options.getSessionForAPIKey) {
            const apiKey = this.getHeader(headers, 'x-api-key')
            if (apiKey) {
                userSession = await this.options.getSessionForAPIKey(apiKey)
            }
        }

        if (this.options.getSessionForCookieValue) {
            const cookie = this.getHeader(headers, 'cookie')
            if (cookie) {
                userSession = await this.getCookieSession(headers)
            }
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

    private getHeader(headers: RequestHeaders, name: string): string | undefined {
        let value: string | string[] | undefined
        if (typeof headers === 'function') {
            value = headers(name)
        } else {
            value = headers[name]
        }
        if (value instanceof Array) {
            throw new Error('API key must be a string')
        }
        return value
    }
}