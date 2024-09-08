import { HTTPResponseService } from '@vramework/core/types';

export class ExpressHTTPResponseService implements HTTPResponseService {
    constructor(protected response: any) {

    }

    public setCookie (name: string, value: string, maxAge: number): void {
        this.response.cookie(
            name,
            value,
            {
                maxAge,
                httpOnly: true,
                // secure: true,
                // sameSite: 'none'
                // domain: req.headers.origin,
            }
        )
    }
}