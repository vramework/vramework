import { HttpResponse } from 'uWebSockets.js'
import cookie from 'cookie'
import { VrameworkResponse } from '@vramework/core/vramework-response'

export class VrameworkUWSResponse extends VrameworkResponse {
  constructor(protected response: HttpResponse) {
    super()
  }

  public setStatus(status: number) {
    this.response.writeStatus(status.toString())
  }

  public setRedirect(path: string, status: number = 307) {
    this.response.writeStatus(status.toString())
    this.response.writeHeader('location', path)
  }

  public setJson(body): void {
    this.response.write(JSON.stringify(body))
  }

  public setResponse(body): void {
    this.response.write(body)
  }

  public setHeader(name: string, value: string | boolean | string[]): void {
    this.response.writeHeader(name, value.toString())
  }

  public setCookie(name: string, value: string, options: any): void {
    this.response.writeHeader(
      'set-cookie',
      cookie.serialize(name, value, options)
    )
  }
}
