import { RequestHeaders } from './types'

export const injectIntoUrl = (route: string, keys: Record<string, string>) => {
  for (const [name, value] of Object.entries(keys)) {
    route = route.replace(`:${name}`, value)
  }
  return route
}

export const getHeader = (
  headers: RequestHeaders,
  name: string
): string | undefined => {
  let value: string | string[] | undefined
  if (typeof headers === 'function') {
    value = headers(name)
  } else {
    value = headers[name]
  }
  if (value instanceof Array) {
    throw new Error('Array header values not yet supported')
  }
  return value
}
