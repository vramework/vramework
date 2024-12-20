import { JSONValue } from '@vramework/core'
import { VrameworkHTTPAbstractResponse } from '@vramework/core/http/vramework-http-abstract-response'

export class VrameworkCloudflareHTTPResponse extends VrameworkHTTPAbstractResponse {
  public headers: Record<string, string> = {}
  private status: number = 200
  private body: any

  constructor() {
    super()
  }

  public getCloudflareResponse (): Response {
    return new Response(this.body, {
        status: this.status,
        headers: this.headers,
    })
  }

  public setStatus(status: number): void {
    this.status = status
  }

  public setHeader(name: string, value: string | boolean | string[]): void {
    this.headers[name] = value.toString()
  }

  public setJson(value: JSONValue): void {
    this.body = JSON.stringify(value)
  }

  public setResponse(response: string): void {
    this.body = response
  }

  public setRedirect(path: string, status: number) {
    throw new Error('Method not implemented.')
  }
}
