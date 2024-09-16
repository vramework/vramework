import { VrameworkResponse } from '@vramework/core/vramework-response';
import { CookieSerializeOptions } from 'cookie';
import { cookies } from 'next/headers'

export class VrameworkActionNextResponse extends VrameworkResponse {
    constructor() {
        super()
    }

    public setStatus() {
    }

    public setJson() {
    }

    public setResponse() {
    }

    public setCookie(name: string, value: string, options: CookieSerializeOptions): void {
        const cookieStore = cookies()
        cookieStore.set(name, value, options)
    }

    public clearCookie(name: string): void {
        const cookieStore = cookies()
        cookieStore.delete(name)
    }
}