import { VrameworkQuery } from '@vramework/core'
import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'
import * as cookie from 'cookie'
import { FastifyRequest } from 'fastify'

export class VrameworkFastifyRequest extends VrameworkHTTPAbstractRequest {
  constructor(private request: FastifyRequest) {
    super()
  }

  public async getBody() {
    return this.request.body as unknown
  }

  public getQuery() {
    return this.request.query as VrameworkQuery
  }

  public getIP(): string {
    return this.request.ip
  }

  public getHeader(headerName: string) {
    return this.request.headers[headerName] as string
  }

  public getCookies(): Partial<Record<string, string>> {
    const cookieHeader = this.request.headers['cookie']
    if (cookieHeader) {
      return cookie.parse(cookieHeader)
    }
    return {}
  }
}
