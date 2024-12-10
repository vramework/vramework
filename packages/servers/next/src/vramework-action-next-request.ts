import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'
import { cookies, headers } from 'next/headers.js'

/**
 * The `VrameworkActionNextRequest` class is an extension of the `VrameworkHTTPAbstractRequest` class,
 * specifically designed for handling action requests in a Next.js environment.
 */
export class VrameworkActionNextRequest<
  In,
> extends VrameworkHTTPAbstractRequest<In> {
  private body: any
  private cookies: Record<string, string> | undefined
  private headers: Map<string, string> | undefined

  /**
   * Constructs a new instance of the `VrameworkActionNextRequest` class.
   *
   * @param body - The request body to be wrapped and converted to a plain object.
   */
  constructor(
    body: any,
    private dynamicOptIn: { cookies: boolean; headers: boolean } = {
      cookies: true,
      headers: true,
    }
  ) {
    super()
    // Needed to convert the body to a plain object and validate dates
    this.body = JSON.parse(JSON.stringify(body))
  }

  public async init() {
    if (this.dynamicOptIn.cookies) {
      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll()
      this.cookies = allCookies.reduce<Record<string, string>>(
        (result, { name, value }) => {
          result[name] = value
          return result
        },
        {}
      )
    }

    if (this.dynamicOptIn.headers) {
      const headerStore = await headers()
      this.headers = new Map()
      for (const [key, value] of headerStore.entries()) {
        this.headers.set(key, value)
      }
    }
  }

  /**
   * Retrieves the cookies from the request.
   *
   * @returns An object containing the cookies.
   */
  public getCookies() {
    if (!this.cookies) {
      throw new Error('Need to allow dynamic optin for cookies')
    }
    return this.cookies
  }

  /**
   * Retrieves the value of a specific header from the request.
   *
   * @param headerName - The name of the header to retrieve.
   * @returns The value of the specified header, or `undefined` if not found.
   */
  public getHeader(headerName: string): string | undefined {
    if (!this.headers) {
      throw new Error('Need to allow dynamic optin for headers')
    }
    return this.headers.get(headerName)
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
