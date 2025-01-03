import { JSONValue } from '@vramework/core'
import { VrameworkHTTPAbstractResponse } from '@vramework/core/http/vramework-http-abstract-response'
import { APIGatewayProxyResult } from 'aws-lambda'

export class VrameworkAPIGatewayLambdaResponse extends VrameworkHTTPAbstractResponse {
  public headers: Record<string, string> = {}
  private status: number = 200
  private body: any | undefined

  constructor() {
    super()
  }

  public getLambdaResponse(): APIGatewayProxyResult {
    return {
      headers: this.headers,
      statusCode: this.status,
      body: this.body,
    }
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

  public setResponse(response: string | Buffer): void {
    this.body = response
  }

  public setRedirect(path: string, status: number) {
    throw new Error('Method not implemented.')
  }
}
