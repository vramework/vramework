import { JSONValue } from "./types";

export abstract class VrameworkResponse {
    public abstract setStatus(status: number): void 
    public abstract setJson(body: JSONValue): void
    public abstract setResponse(response: JSONValue | string | Buffer): void

    public setHeader(name: string, value: string | boolean | string[]) {
        throw new Error('Method not implemented.');
    }

    public setHeaders(headers: Record<string, string>) {
        for (const [name, value] of Object.keys(headers)) {
            this.setHeader(name, value)
        }
    }

    public setCookie(name: string, value: string, options: unknown) {
        throw new Error('Method not implemented.');
    }
    
    public setRedirect(path: string, status: number) {
        throw new Error('Method not implemented.');
    }
}