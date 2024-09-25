import { VrameworkResponse } from '@vramework/core'
import { IncomingMessage, ServerResponse } from 'http'

export class VrameworkSSRNextResponse extends VrameworkResponse {
  constructor(protected response: ServerResponse<IncomingMessage>) {
    super()
  }

  public setStatus() {}

  public setJson() {}

  public setResponse() {}
}
