import { VrameworkRequest } from '@vramework/core/vramework-request';
import { NextApiRequest } from 'next';

export class VrameworkAPINextRequest extends VrameworkRequest {
    constructor (private request: NextApiRequest) {
        super()
    }

    public getBody() {
        return this.request.body
    }

    public getHeader(headerName: string): string | undefined {
       return this.request.headers[headerName] as string
    }
    
    public getQuery () {
        return this.request.query as Record<string, string | string[]>
    }
    
    public getHeaders () {
        return this.request.headers
    }
}