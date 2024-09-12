import { HTTPRequestService } from '@vramework/core/types'
import { Request } from 'express-serve-static-core'

export class ExpressHTTPRequestService implements HTTPRequestService {
    constructor (private request: Request) {

    }

    getRawBody(): string {
        return JSON.stringify(this.request.body)
    }

    getHeader(name: string): string | null {
        const headers = this.request.headers;
        return headers[name.toLowerCase()] as string || null;
    }

}