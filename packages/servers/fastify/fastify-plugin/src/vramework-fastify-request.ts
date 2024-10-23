import { VrameworkRequest } from '@vramework/core/vramework-request'
import * as cookie from 'cookie'
import { FastifyRequest } from 'fastify'

export class VrameworkFastifyRequest extends VrameworkRequest {
  constructor(private request: FastifyRequest) {
    super()
  }

  public async getBody() {
    return this.request.body as any
  }

  public getQuery() {
    return this.request.query as any
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
