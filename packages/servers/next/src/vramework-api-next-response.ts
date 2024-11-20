import { NextApiResponse } from 'next'
import * as cookie from 'cookie'
import { VrameworkHTTPResponse } from '@vramework/core/vramework-http-response'
import { JSONValue } from '@vramework/core/types/core.types'

/**
 * The `VrameworkAPINextResponse` class is an extension of the `VrameworkHTTPResponse` class,
 * specifically designed for handling API responses in a Next.js environment.
 */
export class VrameworkAPINextResponse extends VrameworkHTTPResponse {
  /**
   * Constructs a new instance of the `VrameworkAPINextResponse` class.
   *
   * @param response - The Next.js API response object to be wrapped.
   */
  constructor(protected response: NextApiResponse) {
    super()
  }

  /**
   * Sets the status of the response.
   *
   * @param status - The HTTP status code to set.
   */
  public setStatus(status: number): void {
    this.response.status(status)
  }

  /**
   * Sets a header in the response.
   *
   * @param name - The name of the header to set.
   * @param value - The value of the header.
   */
  public setHeader(name: string, value: string) {
    this.response.setHeader(name, value)
  }

  /**
   * Sets a cookie in the response.
   *
   * @param name - The name of the cookie.
   * @param value - The value of the cookie.
   * @param options - Options for setting the cookie.
   */
  public setCookie(name: string, value: string, options: any): void {
    this.setHeader('set-cookie', cookie.serialize(name, value, options))
  }

  /**
   * Clears a cookie from the response.
   *
   * @param name - The name of the cookie to clear.
   */
  public clearCookie(name: string): void {
    this.setHeader(
      'set-cookie',
      cookie.serialize(name, '', { expires: new Date(0) })
    )
  }

  /**
   * Sets a redirect response.
   *
   * @param path - The path to redirect to.
   * @param status - The HTTP status code for the redirect. Defaults to 307.
   */
  public setRedirect(path: string, status: number | undefined = 307) {
    this.response.redirect(status, path)
  }

  /**
   * Sets the response body as JSON.
   *
   * @param body - The JSON body to set.
   */
  public setJson(body: JSONValue): void {
    this.response.json(body)
  }

  /**
   * Sets the response body.
   *
   * @param body - The body to set, which can be JSON, a string, or a buffer.
   */
  public setResponse(body: JSONValue | string | Buffer): void {
    this.response.send(body)
  }
}
