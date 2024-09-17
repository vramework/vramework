import { VrameworkRequest } from "@vramework/core/vramework-request";

export class VrameworkTestRequest extends VrameworkRequest {
    constructor () {
        super()
    }

    public getHeader(headerName: string): string | undefined {
        throw new Error("Method not implemented.");
    }

}
