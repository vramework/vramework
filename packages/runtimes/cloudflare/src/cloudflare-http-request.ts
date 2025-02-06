import type { HTTPMethod, VrameworkQuery } from '@vramework/core/http'
import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'
import type { Request, IncomingRequestCfProperties } from '@cloudflare/workers-types'

export class CloudflareHTTPRequest extends VrameworkHTTPAbstractRequest {
  private url: URL

  constructor(private request: Request<unknown, IncomingRequestCfProperties<unknown>>) {
    super()
    this.url = new URL(request.url)
  }

  public getPath() {
    return this.url.pathname
  }

  public getMethod() {
    return this.request.method.toLowerCase() as HTTPMethod
  }

  public async getBody() {
    return this.request.body
  }

  public getHeader(headerName: string): string | undefined {
    return this.request.headers.get(headerName) || undefined
  }

  public getQuery () {
    return Object.fromEntries(this.url.searchParams.entries()) as VrameworkQuery
  }
}
