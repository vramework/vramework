export enum ServerActionStatus {
    Progress = 'progress',
    Done = 'done',
    Error = 'error',
  }
  
  export interface ServerActionState {
    status: ServerActionStatus
    error?: Response
  }
  
  type Body = any
  
  let apiPrefix = ''
  export const setAPIPrefix = (prefix: string) => {
    apiPrefix = prefix
  }
  
  async function action<R>(method: string, url: string, body: Body, hasResponseBody?: true): Promise<R>
  async function action(method: string, url: string, body: Body, hasResponseBody?: false): Promise<void>
  async function action<R>(method: string, url: string, body: Body, hasResponseBody = true): Promise<R | void> {
    const data = JSON.stringify(body)
    const response = await fetch(`${apiPrefix}/${url}`, {
      method,
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: data,
    })
    if (response.status >= 400) {
      try {
        const body = await response.json()
        throw body.error
      } catch (e) {
        console.error(e)
        throw 'Unknown error on server'
      }
    }
    if (hasResponseBody) {
      return await response.json()
    }
  }
  
  export async function post<R>(url: string, data: Body, hasResponseBody?: boolean): Promise<R>
  export async function post(url: string, data: Body, hasResponseBody?: false): Promise<void>
  export async function post<R>(url: string, data: Body, hasResponseBody = true): Promise<R | void> {
    if (hasResponseBody) {
      return await action('POST', url, data, true)
    }
    await action('POST', url, data, false)
  }
  
  export async function patch<R>(url: string, data: Body, hasResponseBody?: boolean): Promise<R>
  export async function patch(url: string, data: Body, hasResponseBody?: false): Promise<void>
  export async function patch<R>(url: string, data: Body, hasResponseBody = true): Promise<R | void> {
    if (hasResponseBody) {
      return await action('PATCH', url, data, true)
    }
    await action('PATCH', url, data, false)
  }
  
  export async function get<R>(url: string, query?: Record<string, string>, hasResponseBody?: boolean): Promise<R>
  export async function get(url: string, query?: Record<string, string>, hasResponseBody?: boolean): Promise<void>
  export async function get<T>(
    url: string,
    query: Record<string, string> = {},
    hasResponseBody = true,
  ): Promise<T | undefined> {
    let uri = `${apiPrefix}/${url}`
    if (query) {
      // removes all the undefined
      const params = new URLSearchParams(JSON.parse(JSON.stringify(query)))
      uri = `${apiPrefix}/${url}?${params}`
    }
    const response = await fetch(uri, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    })
    if (response.status > 400) {
      throw response
    }
    if (hasResponseBody) {
      try {
        return await response.json()
      } catch (e) {
        throw 'Unable to parse json response'
      }
    }
    return undefined
  }
  
  export async function head(url: string, query?: Record<string, string>): Promise<number> {
    let uri = `${apiPrefix}/${url}`
    if (query) {
      const params = new URLSearchParams(query)
      uri = `${apiPrefix}/${url}?${params}`
    }
    const response = await fetch(uri, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'include',
    })
    return response.status
  }
  
  export async function del(url: string): Promise<void> {
    const response = await fetch(`${apiPrefix}/${url}`, {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'include',
    })
    if (response.status > 400) {
      alert('Something went wrong!')
      throw 'Didnt happen'
    }
  }
  