import { JSONValue } from "@vramework/core/types";
import { VrameworkResponse } from "@vramework/core/vramework-response";

export class VrameworkTestResponse extends VrameworkResponse {
    constructor () {
        super()
    }

    public setStatus(status: number): void {
        throw new Error("Method not implemented.");
    }
    
    public setJson(body: JSONValue): void {
        throw new Error("Method not implemented.");
    }

    public setResponse(response: string | Buffer): void {
        throw new Error("Method not implemented.");
    }
}
