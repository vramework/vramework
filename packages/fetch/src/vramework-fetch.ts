export const coreVrameworkFetch = async (
  uri: string,
  data: any,
  options?: Omit<RequestInit, 'body'>
) => {
  const method = options?.method || 'GET'
  let body: any | undefined

  if (data) {
    data = JSON.parse(JSON.stringify(data))

    const keys = Object.keys(data)
    for (const key of keys) {
      if (uri.includes(`:${key}`)) {
        uri = uri.replace(`:${key}`, data[key])
        delete data[key]
      }
    }
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      body = data
    } else {
      const queryString = new URLSearchParams(JSON.parse(JSON.stringify(data)))
      uri = `${uri}?${queryString}`
    }
  }

  return await fetch(uri, {
    method,
    ...options,
    body: body ? JSON.stringify(body) : undefined,
  })
}
