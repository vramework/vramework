import { VrameworkRequest } from '@vramework/core/vramework-request'
import { Request } from 'express-serve-static-core'
import getRawBody from 'raw-body'

export class VrameworkExpressRequest extends VrameworkRequest {
  constructor(private request: Request) {
    super()
  }

  public getBody() {
    return this.request.body
  }

  public async getRawBody() {
    return await getRawBody(this.request)
  }

  public getQuery() {
    // TODO: Verify query is a Record<string, string | string[]>
    return this.request.query as Record<string, string | string[]>
  }

  public getHeader(headerName: string) {
    const header = this.request.headers[headerName]
    if (header instanceof Array) {
      throw new Error('Header arrays not supported')
    }
    return header
  }
}
