import { VrameworkRequest } from '@vramework/core/vramework-request'
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers.js'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'

export class VrameworkActionNextRequest extends VrameworkRequest {
  private body: any

  constructor(body: any, private cookies: ReadonlyRequestCookies, private headers: ReadonlyHeaders) {
    super()
    // Needed to convert the body to a plain object
    // and date validation
    this.body = JSON.parse(JSON.stringify(body))
  }

  public getCookies() {
    const allCookies = this.cookies.getAll()
    return allCookies.reduce<Record<string, string>>(
      (result, { name, value }) => {
        result[name] = value
        return result
      },
      {}
    )
  }

  public getHeader(headerName: string): string | undefined {
    return this.headers.get(headerName) || undefined
  }

  public getBody() {
    return this.body
  }
}
