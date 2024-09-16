import { parse as parseCookie } from 'cookie'
import { VrameworkQuery } from './types'

export abstract class VrameworkRequest<In = any> {
    private params: Partial<Record<string, string | string[]>> = {}

    public getBody (): Promise<In> {
        throw new Error('Method not implemented.')
    }

    public getRawBody (): Promise<Buffer> {
        throw new Error('Method not implemented.')
    }

    public abstract getHeader (headerName: string): string | undefined

    public getCookies (): Partial<Record<string, string>> {
        const cookieHeader = this.getHeader('cookie')
        if (cookieHeader) {
            return parseCookie(cookieHeader)
        }
        return {}
    }

    public getParams () {
        return this.params
    }

    public setParams (params: Record<string, string | string[] | undefined>) {
        this.params = params
    }

    public getQuery (): VrameworkQuery {
        return {}
    }

    public getIP (): string {
        throw new Error('Method not implemented.')
    }

    public async getData (_contentType: string | undefined = 'application/json'): Promise<In> {
        return {
            ...this.getParams(),
            ...this.getQuery(),
            // TODO: If body isn't an object, we should insert it as the word...
            ...(await this.getBody()),
        }
    }
}