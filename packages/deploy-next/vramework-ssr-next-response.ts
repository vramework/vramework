import { VrameworkResponse } from '@vramework/core/vramework-response';
import { IncomingMessage, ServerResponse } from 'http';

export class VrameworkSSRNextResponse extends VrameworkResponse {
    constructor(protected response: ServerResponse<IncomingMessage>) {
        super()
    }
}