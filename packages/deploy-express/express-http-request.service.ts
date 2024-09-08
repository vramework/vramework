import { HTTPRequestService } from '@vramework/core/types';

export class ExpressHTTPRequestService implements HTTPRequestService {
    constructor (private request: any, private response: any) {

    }

    getRawBody(): string {
        return JSON.stringify(this.request.body)
    }

    getHeader(name: string): string | null {
        const headers = this.request.headers;
        return headers[name.toLowerCase()] || null;
    }

}