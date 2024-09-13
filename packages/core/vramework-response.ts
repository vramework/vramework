import { JSONValue } from "./types";

export abstract class VrameworkResponse {
    public setStatus(status: number): void {
        throw new Error('Method not implemented.');
    }

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
    
    public setJson(body: JSONValue): void {
        throw new Error('Method not implemented.');
    }

    public setResponse(response: JSONValue | string | Buffer): void {
        throw new Error('Method not implemented.');
    }
}