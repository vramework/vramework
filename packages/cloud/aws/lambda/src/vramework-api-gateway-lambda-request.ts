import { VrameworkHTTPAbstractRequest } from '@vramework/core/http'
import { APIGatewayProxyEvent } from 'aws-lambda'

export class VrameworkAPIGatewayLambdaRequest extends VrameworkHTTPAbstractRequest {
  constructor(protected event: APIGatewayProxyEvent) {
    super()
  }

  public getPath() {
    return this.event.path
  }

  public getMethod() {
    return this.event.httpMethod.toLowerCase() as
      | 'post'
      | 'get'
      | 'delete'
      | 'patch'
      | 'head'
      | 'options'
  }

  public async getBody() {
    throw new Error('Method not implemented.')
  }

  public getHeader(_headerName: string): string | undefined {
    throw new Error('Method not implemented.')
  }
}
