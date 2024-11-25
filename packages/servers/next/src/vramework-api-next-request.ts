import { VrameworkHTTPRequest } from '@vramework/core/http/vramework-http-request'
import { NextApiRequest } from 'next'

/**
 * The `VrameworkAPINextRequest` class is an extension of the `VrameworkHTTPRequest` class,
 * specifically designed for handling API requests in a Next.js environment.
 */
export class VrameworkAPINextRequest<In> extends VrameworkHTTPRequest<In> {
  /**
   * Constructs a new instance of the `VrameworkAPINextRequest` class.
   *
   * @param request - The Next.js API request object to be wrapped.
   */
  constructor(private request: NextApiRequest) {
    super()
  }

  /**
   * Retrieves the body of the request.
   *
   * @returns The parsed body of the request if it is JSON, or the raw body otherwise.
   */
  public getBody() {
    try {
      return JSON.parse(this.request.body)
    } catch {
      return this.request.body
    }
  }

  /**
   * Retrieves the value of a specific header from the request.
   *
   * @param headerName - The name of the header to retrieve.
   * @returns The value of the specified header, or `undefined` if not found.
   */
  public getHeader(headerName: string): string | undefined {
    return this.request.headers[headerName] as string
  }

  /**
   * Retrieves the query parameters from the request.
   *
   * @returns An object containing the query parameters.
   */
  public getQuery() {
    return this.request.query
  }

  /**
   * Retrieves all headers from the request.
   *
   * @returns An object containing all headers.
   */
  public getHeaders() {
    return this.request.headers
  }
}
