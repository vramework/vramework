import { VrameworkRequest } from '@vramework/core/vramework-request';
import { IncomingMessage } from 'http';
import { NextRequest } from 'next/server';

export class VrameworkNextRequest extends VrameworkRequest {
    constructor (private request: NextRequest) {
        super()
    }

    public getCookies () {
        return this.request.cookies.getAll().reduce((acc, cookie) => {
            acc[cookie.name] = cookie.value
            return acc
        }, {})
    }

    public getHeader(headerName: string): string | undefined {
        return this.request.headers.get(headerName) || undefined
    }

    public async getBody () {
        throw new Error('NextJS Request doesn\'t have a body')
    }
}