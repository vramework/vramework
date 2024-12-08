import { EError } from '../error-handler.js'
import {
  APIDocs,
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '../types/core.types.js'
import {
  CoreAPIFunction,
  CoreAPIFunctionSessionless,
  CoreAPIPermission,
} from '../types/functions.types.js'
import { VrameworkRequest } from '../vramework-request.js'
import { VrameworkResponse } from '../vramework-response.js'
import { VrameworkHTTPAbstractRequest } from './vramework-http-abstract-request.js'
import { VrameworkHTTPAbstractResponse } from './vramework-http-abstract-response.js'

type ExtractRouteParams<S extends string> =
  S extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : S extends `${string}:${infer Param}`
      ? Param
      : never

export type AssertRouteParams<In, Route extends string> =
  ExtractRouteParams<Route> extends keyof In
    ? unknown
    : ['Error: Route parameters', ExtractRouteParams<Route>, 'not in', keyof In]

export type RunRouteOptions = Partial<{
  skipUserSession: boolean
  respondWith404: boolean
  logWarningsForStatusCodes: number[]
  coerceToArray: boolean
}>

export type RunRouteParams<In> = {
  singletonServices: CoreSingletonServices
  request: VrameworkRequest<In> | VrameworkHTTPAbstractRequest<In>
  response?: VrameworkResponse | VrameworkHTTPAbstractResponse | undefined
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

/**
 * Represents the HTTP methods supported for API routes.
 */
export type HTTPMethod = 'post' | 'get' | 'delete' | 'patch' | 'head'

/**
 * Represents an API route without a function, including metadata such as content type, route, and timeout settings.
 */
type CoreHTTPFunction = {
  contentType?: 'xml' | 'json'
  route: string
  eventChannel?: false
  returnsJSON?: false
  timeout?: number
  docs?: Partial<{
    description: string
    response: string
    errors: Array<typeof EError>
    tags: string[]
  }>
}

/**
 * Represents a core API route, which can have different configurations depending on whether it requires authentication and permissions.
 *
 * @template In - The input type.
 * @template Out - The output type.
 * @template R - The route string type.
 * @template APIFunction - The API function type, defaults to `CoreAPIFunction`.
 * @template APIFunctionSessionless - The sessionless API function type, defaults to `CoreAPIFunctionSessionless`.
 * @template APIPermission - The permission function type, defaults to `CoreAPIPermission`.
 */
export type CoreHTTPFunctionRoute<
  In,
  Out,
  R extends string,
  APIFunction = CoreAPIFunction<In, Out>,
  APIFunctionSessionless = CoreAPIFunctionSessionless<In, Out>,
  APIPermission = CoreAPIPermission<In>,
> =
  | (CoreHTTPFunction & {
      route: R
      method: HTTPMethod
      func: APIFunction
      permissions?: Record<string, APIPermission[] | APIPermission>
      auth?: true
    })
  | (CoreHTTPFunction & {
      route: R
      method: HTTPMethod
      func: APIFunctionSessionless
      permissions?: undefined
      auth?: false
    })
  | (CoreHTTPFunction & {
      route: R
      method: 'post'
      func: APIFunction
      permissions?: Record<string, APIPermission[] | APIPermission>
      auth?: true
      query?: Array<keyof In>
    })
  | (CoreHTTPFunction & {
      route: R
      method: 'post'
      func: APIFunctionSessionless
      permissions?: undefined
      auth?: false
      query?: Array<keyof In>
    })

/**
 * Represents an array of core API routes.
 */
export type CoreHTTPFunctionRoutes = Array<CoreHTTPFunctionRoute<any, any, string>>

/**
 * Represents the input types for route metadata, including parameters, query, and body types.
 */
export type HTTPFunctionMetaInputTypes = {
  params?: string
  query?: string
  body?: string
}

/**
 * Represents metadata for a set of routes, including route details, methods, input/output types, and documentation.
 */
export type HTTPFunctionsMeta = Array<{
  route: string
  method: HTTPMethod
  params?: string[]
  query?: string[]
  input: string | null
  output: string | null
  inputTypes?: HTTPFunctionMetaInputTypes
  docs?: APIDocs
}>
