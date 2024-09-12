import { HTTPRequestService } from '@vramework/core/types'

export class NextHTTPRequestService implements HTTPRequestService {
    constructor (private request: any) {

    }

    getRawBody(): string {
        return JSON.stringify(this.request.body)
    }

    getHeader(name: string): string | null {
        const headers = this.request.headers;
        return headers[name.toLowerCase()] as string || null;
    }
}