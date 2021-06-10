let restFetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>;

let apiPrefix = ''
let authorizationJwt: string | undefined = undefined

export const transformResult = (data: any) : any => {
  if (data === null) {
    return null
  }

  if (data instanceof Array) {
    return data.map(transformResult)
  }
  
  if (typeof data === 'object') {
    return Object.entries(data).reduce((result, [key, value]) => {
      result[key] = transformResult(value)
      return result
    }, {} as any)
  }  
  
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z?)?/.test(data)) {
    return new Date(data)
  }

  return data
}

export const setAPIPrefix = async (prefix: string) => {
  if (!restFetch) {
    if (typeof window === 'undefined') {
      restFetch = (await import('node-fetch')).default as any
    } else {
      restFetch = fetch
    }
  }
  apiPrefix = prefix
}

export const setAuthorizationJWT = (jwt: string) => {
  authorizationJwt = jwt
}

async function action<R>(method: string, url: string, body: any, hasResponseBody?: true): Promise<R>
async function action(method: string, url: string, body: any, hasResponseBody?: false): Promise<void>
async function action<R>(method: string, url: string, body: any, hasResponseBody = true): Promise<R | void> {
  const data = JSON.stringify(body)

  let headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authorizationJwt) {
    headers.Authorization = `Bearer ${authorizationJwt}`
  }
  try {
    const response = await restFetch(`${apiPrefix}/${url}`, {
      method,
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers,
      body: data,
    })
    if (response.status >= 400) {
      throw response
    }
    if (hasResponseBody) {
      const data = await response.json()
      return transformResult(data)
    }
  } catch (e) {
    // This is a 404
    throw e
  }
}

export async function post<R>(url: string, data: any, hasResponseBody?: boolean): Promise<R>
export async function post(url: string, data: any, hasResponseBody?: false): Promise<void>
export async function post<R>(url: string, data: any, hasResponseBody = true): Promise<R | void> {
  if (hasResponseBody) {
    return await action('POST', url, data, true)
  }
  await action('POST', url, data, false)
}

export async function patch<R>(url: string, data: any, hasResponseBody?: boolean): Promise<R>
export async function patch(url: string, data: any, hasResponseBody?: false): Promise<void>
export async function patch<R>(url: string, data: any, hasResponseBody = true): Promise<R | void> {
  if (hasResponseBody) {
    return await action('PATCH', url, data, true)
  }
  await action('PATCH', url, data, false)
}

export async function get<R>(
  url: string,
  query?: Record<string, string | number | undefined>,
  hasResponseBody?: boolean,
): Promise<R>
export async function get(
  url: string,
  query?: Record<string, string | number | undefined>,
  hasResponseBody?: boolean,
): Promise<void>
export async function get<T>(
  url: string,
  query: Record<string, string | number | undefined> = {},
  hasResponseBody = true,
): Promise<T | undefined> {
  let uri = `${apiPrefix}/${url}`
  if (query) {
    // removes all the undefined
    const params = new URLSearchParams(JSON.parse(JSON.stringify(query)))
    uri = `${apiPrefix}/${url}?${params}`
  }
  const response = await restFetch(uri, {
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
  const response = await restFetch(uri, {
    method: 'HEAD',
    mode: 'cors',
    credentials: 'include',
  })
  return response.status
}

export async function del(url: string): Promise<void> {
  const response = await restFetch(`${apiPrefix}/${url}`, {
    method: 'DELETE',
    mode: 'cors',
    credentials: 'include',
  })
  if (response.status > 400) {
    throw 'Didnt happen'
  }
}
