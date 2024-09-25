import { VrameworkRequest } from '@vramework/core'
import { IncomingMessage } from 'http'

export class VrameworkSSRNextRequest extends VrameworkRequest {
  constructor(
    private request: IncomingMessage & {
      cookies: Partial<{ [key: string]: string }>
    },
    private body: any
  ) {
    super()
  }

  public getCookies() {
    return this.request.cookies
  }

  public getHeader(headerName: string): string | undefined {
    const header = this.request.headers[headerName]
    if (header instanceof Array) {
      throw new Error('Header array values not yet supported')
    }
    return header
  }

  public getBody() {
    return this.body
  }
}
