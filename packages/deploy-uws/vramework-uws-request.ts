import { VrameworkRequest } from '@vramework/core/vramework-request'
import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import cookie from 'cookie'
import querystring from 'qs'

export class VrameworkUWSRequest extends VrameworkRequest {
  constructor(
    private request: HttpRequest,
    private response: HttpResponse
  ) {
    super()
  }

  public async getBody() {
    try {
      return await this.readJson()
    } catch {
      throw new Error('Failed to parse JSON')
    }
  }

  public getQuery() {
    const query = this.request.getQuery()
    return querystring.parse(query) as any
  }

  public getHeader(headerName: string) {
    return this.request.getHeader(headerName)
  }

  public getCookies(): Partial<Record<string, string>> {
    const cookieHeader = this.request.getHeader('cookie')
    return cookie.parse(cookieHeader)
  }

  private readJson() {
    return new Promise((resolve, reject) => {
      let buffer
      /* Register data cb */
      this.response.onData((ab, isLast) => {
        let chunk = Buffer.from(ab)
        if (isLast) {
          let json
          if (buffer) {
            try {
              json = JSON.parse(Buffer.concat([buffer, chunk]).toString())
            } catch {
              /* res.close calls onAborted */
              this.response.close()
              return
            }
            resolve(json)
          } else {
            try {
              json = JSON.parse(chunk.toString())
            } catch {
              /* res.close calls onAborted */
              this.response.close()
              return
            }
            resolve(json)
          }
        } else {
          if (buffer) {
            buffer = Buffer.concat([buffer, chunk])
          } else {
            buffer = Buffer.concat([chunk])
          }
        }
      })
      this.response.onAborted(reject)
    })
  }
}
