import { HttpResponse } from 'uWebSockets.js'
import * as cookie from 'cookie'
import { VrameworkHTTPResponse } from '@vramework/core/http/vramework-http-response'
import { JSONValue } from '@vramework/core/types/core.types'

export class VrameworkUWSResponse extends VrameworkHTTPResponse {
  private aborted = false

  constructor(private uwsResponse: HttpResponse) {
    super()
    uwsResponse.onAborted(() => {
      this.aborted = true
    })
  }

  public setStatus(status: number) {
    if (!this.aborted) {
      this.response().writeStatus(status.toString())
    }
  }

  public setRedirect(path: string, status: number = 307) {
    this.response().writeStatus(status.toString())
    this.response().writeHeader('location', path)
  }

  public setJson(body: JSONValue): void {
    this.response().write(JSON.stringify(body))
  }

  public setResponse(body: string | Buffer): void {
    this.response().write(body)
  }

  public setHeader(name: string, value: string | boolean | string[]): void {
    this.response().writeHeader(name, value.toString())
  }

  public setCookie(name: string, value: string, options: any): void {
    this.response().writeHeader(
      'set-cookie',
      cookie.serialize(name, value, options)
    )
  }

  public end() {
    this.response().endWithoutBody()
  }

  private response() {
    if (this.aborted) {
      throw new Error('Response was aborted')
    }
    return this.uwsResponse
  }
}
