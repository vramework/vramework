import { VrameworkResponse } from '@vramework/core/vramework-response'
import { SerializeOptions } from 'cookie'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'


export class VrameworkActionNextResponse extends VrameworkResponse {
  constructor(private cookies: ReadonlyRequestCookies) {
    super()
  }

  public setStatus() {}

  public setJson() {}

  public setResponse() {}

  public setCookie(
    name: string,
    value: string,
    options: SerializeOptions
  ): void {
    this.cookies.set(name, value, options)
  }

  public clearCookie(name: string): void {
    this.cookies.delete(name)
  }
}
