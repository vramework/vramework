import { VrameworkHTTPAbstractRequest } from '@vramework/core/http'
import { cookies, headers } from 'next/headers.js'

/**
 * The `VrameworkActionNextRequest` class is an extension of the `VrameworkHTTPAbstractRequest` class,
 * specifically designed for handling action requests in a Next.js environment.
 */
export class VrameworkActionNextRequest<In> extends VrameworkHTTPAbstractRequest<In> {
  private body: any

  /**
   * Constructs a new instance of the `VrameworkActionNextRequest` class.
   *
   * @param body - The request body to be wrapped and converted to a plain object.
   */
  constructor(body: any) {
    super()
    // Needed to convert the body to a plain object and validate dates
    this.body = JSON.parse(JSON.stringify(body))
  }

  /**
   * Retrieves the cookies from the request.
   *
   * @returns An object containing the cookies.
   */
  public getCookies() {
    const allCookies = cookies().getAll()
    return allCookies.reduce<Record<string, string>>(
      (result, { name, value }) => {
        result[name] = value
        return result
      },
      {}
    )
  }

  /**
   * Retrieves the value of a specific header from the request.
   *
   * @param headerName - The name of the header to retrieve.
   * @returns The value of the specified header, or `undefined` if not found.
   */
  public getHeader(headerName: string): string | undefined {
    return headers().get(headerName) || undefined
  }

  /**
   * Retrieves the body of the request.
   *
   * @returns The body of the request.
   */
  public getBody() {
    return this.body
  }
}
