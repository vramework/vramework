import { IncomingMessage } from 'http'
import * as cookie from 'cookie'
import * as querystring from 'qs'
import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'

export class VrameworkHTTPRequest extends VrameworkHTTPAbstractRequest {
  constructor(
    private request: IncomingMessage
  ) {
    super()
  }

  public async getBody() {
    try {
      // If the request method is GET, return an empty object since GET
      // shouldn't have a body
      if (this.request.method?.toLowerCase() === 'get') {
        return {}
      }
      return await this.readJson()
    } catch {
      throw new Error('Failed to parse JSON')
    }
  }

  public getQuery() {
    const url = this.request.url || ''
    const queryString = url.split('?')[1] || ''
    return querystring.parse(queryString) as any
  }

  public getHeader(headerName: string) {
    return this.request.headers[headerName.toLowerCase()] as string | undefined
  }

  public getCookies(): Partial<Record<string, string>> {
    const cookieHeader = this.request.headers['cookie']
    return cookie.parse(cookieHeader || '')
  }

  private readJson() {
    return new Promise((resolve, reject) => {
      let body: Buffer[] = []

      // Read data from the request stream
      this.request.on('data', (chunk) => {
        body.push(chunk)
      })

      // When the request is complete
      this.request.on('end', () => {
        try {
          const buffer = Buffer.concat(body)
          const json = JSON.parse(buffer.toString())
          resolve(json)
        } catch (err) {
          reject(new Error('Failed to parse JSON'))
        }
      })

      // If the connection is closed or aborted
      this.request.on('error', (err) => {
        reject(err)
      })
    })
  }
}
