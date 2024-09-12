import { HTTPResponseService } from '@vramework/core/types';
import { Response, CookieOptions } from 'express-serve-static-core'

export class ExpressHTTPResponseService implements HTTPResponseService {
    constructor(protected response: Response) {

    }

    public setCookie (name: string, value: string, options: CookieOptions): void {
        this.response.cookie(name, value, options)
    }
}