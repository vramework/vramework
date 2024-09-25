import { RequestHeaders } from './types'
import { compile } from 'path-to-regexp'

export const injectIntoUrl = (route: string, keys: Record<string, string>) => {
  const path = compile(route)
  return path(keys)
}

// export const getHeader = (
//   headers: RequestHeaders,
//   name: string
// ): string | undefined => {
//   let value: string | string[] | undefined
//   if (typeof headers === 'function') {
//     value = headers(name)
//   } else {
//     value = headers[name]
//   }
//   if (value instanceof Array) {
//     throw new Error('Array header values not yet supported')
//   }
//   return value
// }
