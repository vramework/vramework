import { parse as parseCookie } from 'cookie'

export abstract class VrameworkRequest<In = any> {
    public getBody (): In {
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
        return {}
    }

    public getQuery (): Record<string, string | string[]> {
        return {}
    }

    public async getData (_contentType: string): Promise<In> {
        return {
            ...this.getParams(),
            // TODO: If body isn't an object, we should insert it as the word...
            ...this.getBody(),
            ...this.getQuery(),
        }
    }
}