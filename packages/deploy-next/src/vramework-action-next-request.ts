import { VrameworkRequest } from '@vramework/core/vramework-request'
import { cookies, headers } from 'next/headers'


export class VrameworkActionNextRequest extends VrameworkRequest {
  private body: any

  constructor(body: any) {
    super()
    // Needed to convert the body to a plain object
    // and date validation
    this.body = JSON.parse(JSON.stringify(body))
  }

  public getCookies() {
    const allCookies = cookies().getAll()
    return allCookies.reduce(
      (result, { name, value }) => {
        result[name] = value
        return result
      },
      {} as Record<string, string>
    )
  }

  public getHeader(headerName: string): string | undefined {
    return headers().get(headerName) || undefined
  }

  public getBody() {
    return this.body
  }
}
