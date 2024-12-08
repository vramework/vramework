import { VrameworkHTTPAbstractResponse } from '@vramework/core/http/vramework-http-abstract-response'
import type { SerializeOptions } from 'cookie'
import { cookies } from 'next/headers.js'

/**
 * The `VrameworkActionNextResponse` class is an extension of the `VrameworkHTTPAbstractResponse` class,
 * specifically designed for handling action responses in a Next.js environment.
 */
export class VrameworkActionNextResponse extends VrameworkHTTPAbstractResponse {
  /**
   * Constructs a new instance of the `VrameworkActionNextResponse` class.
   */
  constructor() {
    super()
  }

  /**
   * Sets the status of the response.
   *
   * @remarks
   * This method is currently a placeholder and should be implemented as needed.
   */
  public setStatus() {}

  /**
   * Sets the response body as JSON.
   *
   * @remarks
   * This method is currently a placeholder and should be implemented as needed.
   */
  public setJson() {}

  /**
   * Sets the final response to be sent to the client.
   *
   * @remarks
   * This method is currently a placeholder and should be implemented as needed.
   */
  public setResponse() {}

  /**
   * Sets a cookie in the response.
   *
   * @param name - The name of the cookie.
   * @param value - The value of the cookie.
   * @param options - Options for setting the cookie.
   */
  public setCookie(
    name: string,
    value: string,
    options: SerializeOptions
  ): void {
    const cookieStore = cookies()
    cookieStore.set(name, value, options)
  }

  /**
   * Clears a cookie from the response.
   *
   * @param name - The name of the cookie to clear.
   */
  public clearCookie(name: string): void {
    const cookieStore = cookies()
    cookieStore.delete(name)
  }
}
