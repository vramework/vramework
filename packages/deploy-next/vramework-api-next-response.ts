import { JSONValue } from '@vramework/core/types';
import { VrameworkResponse } from '@vramework/core/vramework-response';
import { NextApiResponse } from 'next';

export class VrameworkAPINextResponse extends VrameworkResponse {
    constructor(protected response: NextApiResponse) {
        super()
    }

    public setStatus(status: number): void {
        this.response.status(status)
    }

    public setHeader(name: string, value: string) {
        this.response.setHeader(name, value)
    }

    public setCookie(name: string, value: string, options: unknown) {
        throw new Error('Setting cookie not supported in NextJS API');
    }

    public setRedirect(path: string, status: number | undefined = 307) {
        this.response.redirect(status, path)
    }

    public setJson(body: JSONValue): void {
        this.response.json(body)
    }

    public setResponse(body: JSONValue | string | Buffer): void {
        this.response.send(body)
    }
}