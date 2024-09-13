import { VrameworkRequest } from '@vramework/core/vramework-request';
import { Request } from 'express-serve-static-core'

export class VrameworkExpressRequest extends VrameworkRequest {
    constructor (private request: Request) {
        super()
    }

    public getParams () {
       return this.request.params
    }

    public getBody () {
       return this.request.body
    }

    public getQuery () {
        // TODO: Verify query is a Record<string, string | string[]>
        return this.request.query as Record<string, string | string[]>
    }

    public getHeader (headerName: string) {
        const header = this.request.headers[headerName]
        if (header instanceof Array) {
            throw new Error('Header arrays not supported')
        }
        return header
    }
}