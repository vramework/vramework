import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { HTTPMethod, VrameworkQuery } from '@vramework/core/http'
import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'

export class VrameworkAPIGatewayLambdaRequest extends VrameworkHTTPAbstractRequest {
  constructor(protected event: APIGatewayProxyEvent) {
    super()
  }

  public getPath() {
    // TODO: The path can be undefined, types are invalid
    return this.event.path || '/'
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

  public getQuery () {
    // TODO: If query isn't defined, it should be an empty object
    return this.event.queryStringParameters as VrameworkQuery || {}
  }
}
