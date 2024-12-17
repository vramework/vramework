import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { HTTPMethod } from '@vramework/core/http'
import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'

export class VrameworkAPIGatewayLambdaRequest extends VrameworkHTTPAbstractRequest {
  constructor(protected event: APIGatewayProxyEvent) {
    super()
  }

  public getPath() {
    return this.event.path
  }

  public getMethod() {
    return this.event.httpMethod.toLowerCase() as HTTPMethod
  }

  public async getBody() {
    return this.event.body
  }

  public getHeader(headerName: string): string | undefined {
    return this.event.headers[headerName]
  }

}
