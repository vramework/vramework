import { transformDates } from './transform-date.js'
import { coreVrameworkFetch } from './vramework-fetch.js'

type AuthHeaders = {
  jwt?: string
  apiKey?: string
}

export type HTTPMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD' | 'PUT'

export type CoreVrameworkFetchOptions = {
  transformDate?: boolean
  serverUrl?: string
  authHeaders?: AuthHeaders
} & Pick<RequestInit, 'cache' | 'credentials' | 'mode'>

export class CoreVrameworkFetch {
  private authHeaders: AuthHeaders = { jwt: undefined, apiKey: undefined }

  constructor(private options: CoreVrameworkFetchOptions = {}) {
    this.authHeaders = options.authHeaders || {}
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.authHeaders.jwt) {
      headers.Authorization = `Bearer ${this.authHeaders.jwt}`
    } else if (this.authHeaders.apiKey) {
      headers['X-API-KEY'] = this.authHeaders.apiKey
    }
    return headers
  }

  public async setServerUrl(serverUrl: string): Promise<void> {
    this.options.serverUrl = serverUrl
  }

  public setAuthorizationJWT(jwt: string): void {
    this.authHeaders.jwt = jwt
  }

  public setAPIKey(apiKey?: string): void {
    this.authHeaders.apiKey = apiKey
  }

  public async api(
    uri: string,
    method: HTTPMethod,
    data: any,
    options?: RequestInit
  ) {
    const response = await this.fetch(uri, method, data, options)
    if (response.status > 400) {
      throw response
    }
    try {
      const result = await response.json()
      return this.transformDates(result)
    } catch {
      // TODO: If it doesn't return anything..
      return
    }
  }

  public async fetch(
    uri: string,
    method: HTTPMethod,
    data: any,
    options?: RequestInit
  ) {
    this.verifyServerUrlSet()
    uri = `${this.options.serverUrl}/${uri}`

    return await coreVrameworkFetch(uri, data, {
      ...options,
      method,
      mode: this.options.mode,
      credentials: this.options.credentials,
      headers: { ...this.getHeaders(), ...options?.headers },
    })
  }

  private verifyServerUrlSet() {
    if (!this.options.serverUrl) {
      throw new Error('Server url is not set')
    }
  }

  private transformDates(data: any): any {
    if (!this.options.transformDate) {
      return data
    }
    return transformDates(data)
  }
}
