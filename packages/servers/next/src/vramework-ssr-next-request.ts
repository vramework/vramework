import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'
import { IncomingMessage } from 'http'

/**
 * The `VrameworkSSRNextRequest` class is an extension of the `VrameworkHTTPAbstractRequest` class,
 * specifically designed for handling server-side rendering (SSR) requests in a Next.js environment.
 */
export class VrameworkSSRNextRequest<In> extends VrameworkHTTPAbstractRequest<In> {
  /**
   * Constructs a new instance of the `VrameworkSSRNextRequest` class.
   *
   * @param request - The HTTP request object, including cookies.
   * @param body - The request body.
   */
  constructor(
    private request: IncomingMessage & {
      cookies: Partial<{ [key: string]: string }>
    },
    private body: any
  ) {
    super()
  }

  /**
   * Retrieves the cookies from the request.
   *
   * @returns An object containing the cookies.
   */
  public getCookies() {
    return this.request.cookies
  }

  /**
   * Retrieves the value of a specific header from the request.
   *
   * @param headerName - The name of the header to retrieve.
   * @returns The value of the specified header, or `undefined` if not found.
   * @throws An error if the header value is an array, as array values are not yet supported.
   */
  public getHeader(headerName: string): string | undefined {
    const header = this.request.headers[headerName]
    if (header instanceof Array) {
      throw new Error('Header array values not yet supported')
    }
    return header
  }

  /**
   * Retrieves the body of the request.
   *
   * @returns The request body.
   */
  public getBody() {
    return this.body
  }
}
