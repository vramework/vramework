import { EError } from '../error-handler.js'
import { CoreUserSession, CoreServices } from './core.types.js'

/**
 * Represents a core API function that performs an operation using core services and a user session.
 *
 * @template In - The input type.
 * @template Out - The output type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreAPIFunction<
  In,
  Out,
  Services = CoreServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session: Session) => Promise<Out>

/**
 * Represents a core API function that can be used without a session.
 *
 * @template In - The input type.
 * @template Out - The output type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreAPIFunctionSessionless<
  In,
  Out,
  Services = CoreServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session?: Session) => Promise<Out>

/**
 * Represents a function that checks permissions for a given API operation.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreAPIPermission<
  In = any,
  Services = CoreServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session?: Session) => Promise<boolean>

/**
 * Represents the HTTP methods supported for API routes.
 */
export type APIRouteMethod = 'post' | 'get' | 'delete' | 'patch' | 'head'

/**
 * Represents an API route without a function, including metadata such as content type, route, and timeout settings.
 */
type CoreFunctionlessAPIRoute = {
  contentType?: 'xml' | 'json'
  route: string
  eventStream?: false
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
export type CoreAPIRoute<
  In,
  Out,
  R extends string,
  APIFunction = CoreAPIFunction<In, Out>,
  APIFunctionSessionless = CoreAPIFunctionSessionless<In, Out>,
  APIPermission = CoreAPIPermission<In>,
> =
  | (CoreFunctionlessAPIRoute & {
      route: R
      method: APIRouteMethod
      func: APIFunction
      permissions?: Record<string, APIPermission[] | APIPermission>
      auth?: true
    })
  | (CoreFunctionlessAPIRoute & {
      route: R
      method: APIRouteMethod
      func: APIFunctionSessionless
      permissions?: undefined
      auth?: false
    })
  | (CoreFunctionlessAPIRoute & {
      route: R
      method: 'post'
      func: APIFunction
      permissions?: Record<string, APIPermission[] | APIPermission>
      auth?: true
      query?: Array<keyof In>
    })
  | (CoreFunctionlessAPIRoute & {
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
export type CoreAPIRoutes = Array<CoreAPIRoute<any, any, string>>

/**
 * Represents the input types for route metadata, including parameters, query, and body types.
 */
export type RoutesMetaInputTypes = {
  params?: string
  query?: string
  body?: string
}

/**
 * Represents the documentation for a route, including summary, description, tags, and errors.
 */
export type RouteDocs = {
  summary?: string
  description?: string
  tags?: string[]
  errors?: string[]
}

/**
 * Represents metadata for a set of routes, including route details, methods, input/output types, and documentation.
 */
export type RoutesMeta = Array<{
  route: string
  method: APIRouteMethod
  params?: string[]
  query?: string[]
  input: string | null
  output: string | null
  inputTypes?: RoutesMetaInputTypes
  docs?: RouteDocs
}>
