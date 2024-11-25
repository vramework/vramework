import { VrameworkHTTPRequest } from '@vramework/core/http/vramework-http-request'

/**
 * The `VrameworkActionStaticNextRequest` class is an extension of the `VrameworkHTTPRequest` class,
 * specifically designed for handling static action requests in a Next.js environment.
 */
export class VrameworkActionStaticNextRequest<In> extends VrameworkHTTPRequest<In> {
  private body: any

  /**
   * Constructs a new instance of the `VrameworkActionStaticNextRequest` class.
   *
   * @param body - The request body to be wrapped and converted to a plain object.
   */
  constructor(body: any) {
    super()
    // Needed to convert the body to a plain object and validate dates
    this.body = JSON.parse(JSON.stringify(body))
  }

  /**
   * Throws an error because headers cannot be accessed in a static request.
   *
   * @param _headerName - The name of the header (unused).
   * @throws An error indicating that headers cannot be accessed in a static request.
   */
  public getHeader(_headerName: string): string | undefined {
    throw new Error("Can't access headers in a static request")
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
