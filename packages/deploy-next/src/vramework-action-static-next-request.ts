import { VrameworkRequest } from '@vramework/core/vramework-request'

export class VrameworkActionStaticNextRequest extends VrameworkRequest {
  private body: any

  constructor(body: any) {
    super()
    // Needed to convert the body to a plain object
    // and date validation
    this.body = JSON.parse(JSON.stringify(body))
  }

  public getHeader(_headerName: string): string | undefined {
    throw new Error('Can\'t acces headers in a static request')
  }

  public getBody() {
    return this.body
  }
}
