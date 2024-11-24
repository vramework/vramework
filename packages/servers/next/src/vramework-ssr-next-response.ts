import { VrameworkHTTPResponse } from '@vramework/core/http/vramework-http-response'
import { IncomingMessage, ServerResponse } from 'http'

/**
 * The `VrameworkSSRNextResponse` class is an extension of the `VrameworkHTTPResponse` class,
 * specifically for handling server-side rendering (SSR) responses in a Next.js environment.
 */
export class VrameworkSSRNextResponse extends VrameworkHTTPResponse {
  /**
   * Constructs a new instance of the `VrameworkSSRNextResponse` class.
   *
   * @param response - The HTTP response object to be wrapped.
   */
  constructor(protected response: ServerResponse<IncomingMessage>) {
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
   * Sets the JSON body of the response.
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
}
