import { VrameworkResponse } from '@vramework/core/vramework-response'
import { SerializeOptions } from 'cookie'

// @ts-ignore
import { cookies } from 'next/headers'

export class VrameworkActionNextResponse extends VrameworkResponse {
  constructor() {
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
    const cookieStore = cookies()
    cookieStore.set(name, value, options)
  }

  public clearCookie(name: string): void {
    const cookieStore = cookies()
    cookieStore.delete(name)
  }
}
