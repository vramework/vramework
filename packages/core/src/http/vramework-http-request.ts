import { parse as parseCookie } from 'cookie'
import { VrameworkQuery } from '../types/core.types.js'
import { VrameworkRequest } from '../vramework-request.js'

/**
 * Abstract class representing a vramework request.
 * @template In - The type of the request body.
 * @group RequestResponse
 */
export abstract class VrameworkHTTPRequest<
  In = unknown,
> extends VrameworkRequest<In> {
  private params: Partial<Record<string, string | string[]>> = {}

  /**
   * Retrieves the request body.
   * @returns A promise that resolves to the request body.
   */
  public getBody(): Promise<In> {
    throw new Error('Method not implemented.')
  }

  /**
   * Retrieves the raw request body as a Buffer.
   * @returns A promise that resolves to the raw request body.
   */
  public getRawBody(): Promise<Buffer> {
    throw new Error('Method not implemented.')
  }

  /**
   * Retrieves the value of a specific header.
   * @param headerName - The name of the header to retrieve.
   * @returns The value of the header, or undefined if the header is not found.
   */
  public abstract getHeader(headerName: string): string | undefined

  /**
   * Retrieves the cookies from the request.
   * @returns An object containing the cookies.
   */
  public getCookies(): Partial<Record<string, string>> {
    const cookieHeader = this.getHeader('cookie')
    if (cookieHeader) {
      return parseCookie(cookieHeader)
    }
    return {}
  }

  /**
   * Retrieves the request parameters.
   * @returns An object containing the request parameters.
   */
  public getParams(): Partial<Record<string, string | string[]>> {
    return this.params
  }

  /**
   * Sets the request parameters.
   * @param params - An object containing the request parameters to set.
   */
  public setParams(
    params: Record<string, string | string[] | undefined>
  ): void {
    this.params = params
  }

  /**
   * Retrieves the query parameters from the request.
   * @returns An object containing the query parameters.
   */
  public getQuery(): VrameworkQuery {
    return {}
  }

  /**
   * Retrieves the IP address of the client making the request.
   * @returns The IP address of the client.
   * @throws {Error} This method is not implemented and should be overridden by subclasses.
   */
  public getIP(): string {
    throw new Error('Method not implemented.')
  }

  /**
   * Retrieves the combined data from the request, including parameters, query, and body.
   * @returns A promise that resolves to an object containing the combined data.
   */
  public async getData(): Promise<In> {
    return {
      ...this.getParams(),
      ...this.getQuery(),
      // TODO: If body isn't an object, we should insert it as the word...
      ...(await this.getBody()),
    }
  }
}
