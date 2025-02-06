import { IncomingMessage } from 'http'
import * as cookie from 'cookie'
import { VrameworkHTTPAbstractRequest } from '@vramework/core/http/vramework-http-abstract-request'
import { VrameworkQuery } from '@vramework/core/http'

export class VrameworkHTTPRequest extends VrameworkHTTPAbstractRequest {
  private url: URL
  private query: VrameworkQuery | undefined

  constructor(private request: IncomingMessage) {
    super()
    // TODO: This is a hack to make the URL object work without caring about the domain
    this.url = new URL(request.url || '/', 'http://ignore-this.com')
  }

  public getPath () {
    return this.url.pathname
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
    if (!this.query) {
      this.query = Object.fromEntries(this.url.searchParams.entries())
    }
    return this.query
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
