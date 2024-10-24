import { JSONValue } from '@vramework/core/types/core.types'
import { VrameworkResponse } from '@vramework/core/vramework-response'
import { APIGatewayProxyResult } from 'aws-lambda'

export class VrameworkLambdaResponse extends VrameworkResponse {
  public headers: Record<string, string> = {}
  private status: number = 200
  private body: any

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
}
