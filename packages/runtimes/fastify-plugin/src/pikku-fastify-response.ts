import { JSONValue } from '@pikku/core'
import { PikkuHTTPAbstractResponse } from '@pikku/core/http/pikku-http-abstract-response'
import { FastifyReply } from 'fastify'

export class PikkuFastifyResponse extends PikkuHTTPAbstractResponse {
  constructor(protected response: FastifyReply) {
    super()
  }

  public setStatus(status: number) {
    this.response.status(status)
  }

  public setRedirect(path: string, status: number = 307) {
    this.response.redirect(path, status)
  }

  public setJson(body: JSONValue): void {
    this.response.send(JSON.stringify(body))
  }

  public setResponse(body: string | Buffer): void {
    this.response.send(body)
  }

  public setHeader(name: string, value: string | boolean | string[]): void {
    this.response.header(name, value.toString())
  }
}
