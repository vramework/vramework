import { getErrorResponse } from './error-handler.js'
import { verifyPermissions } from './permissions.js'
import {
  CoreAPIRoute,
  CoreAPIRoutes,
  RoutesMeta,
} from './types/routes.types.js'
import { coerceQueryStringToArray, loadSchema, validateJson } from './schema.js'
import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
  VrameworkHTTPInteraction,
} from './types/core.types.js'
import { match } from 'path-to-regexp'
import { VrameworkHTTPRequest } from './vramework-http-request.js'
import { VrameworkHTTPResponse } from './vramework-http-response.js'
import { Logger, SessionService } from './services/index.js'
import { RouteNotFoundError, NotImplementedError } from './errors.js'
import * as cryptoImp from 'crypto'
import { VrameworkRequest } from './vramework-request.js'
import { VrameworkResponse } from './vramework-response.js'
import { closeServices } from './utils.js'
const crypto = 'default' in cryptoImp ? cryptoImp.default : (cryptoImp as any)

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
  request: VrameworkRequest<In> | VrameworkHTTPRequest<In>
  response?: VrameworkResponse | VrameworkHTTPResponse | undefined
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

let routes: CoreAPIRoutes = []
let routesMeta: RoutesMeta = []

export const addRoute = <
  In,
  Out,
  Route extends string,
  APIFunction,
  APIFunctionSessionless,
  APIPermission,
>(
  route: CoreAPIRoute<
    In,
    Out,
    Route,
    APIFunction,
    APIFunctionSessionless,
    APIPermission
  >
) => {
  routes.push(route as any)
}

export const clearRoutes = () => {
  routes = []
}

/**
 * @ignore
 */
export const addRouteMeta = (_routeMeta: RoutesMeta) => {
  routesMeta = _routeMeta
}

/**
 * Returns all the registered routes and associated metadata.
 * @internal
 */
export const getRoutes = () => {
  return {
    routes,
    routesMeta,
  }
}

const getMatchingRoute = (
  logger: CoreSingletonServices['logger'],
  requestType: string,
  requestPath: string
) => {
  for (const route of routes) {
    // TODO: This is a performance improvement, but we could
    // run against all routes if we want to return a 405 method.
    // Probably want a cache to support.
    if (route.method !== requestType.toLowerCase()) {
      continue
    }
    const matchFunc = match(`/${route.route}`.replace(/^\/\//, '/'), {
      decode: decodeURIComponent,
    })
    const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))

    if (matchedPath) {
      // TODO: Cache this loop as a performance improvement
      const schemaName = routesMeta.find(
        (routeMeta) =>
          routeMeta.method === route.method && routeMeta.route === route.route
      )?.input
      if (schemaName) {
        loadSchema(schemaName, logger)
      }
      return { matchedPath, params: matchedPath.params, route, schemaName }
    }
  }
  logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new RouteNotFoundError()
}

export const getUserSession = async <UserSession extends CoreUserSession>(
  sessionService: SessionService<UserSession> | undefined,
  auth: boolean,
  request: VrameworkHTTPRequest
): Promise<CoreUserSession | undefined> => {
  if (sessionService) {
    return (await sessionService.getUserSession(auth, request)) as UserSession
  } else if (auth) {
    throw new NotImplementedError('Session service not implemented')
  }
  return undefined
}

const loadUserSession = async (
  skipUserSession: boolean, 
  requiresSession: boolean, 
  http: VrameworkHTTPInteraction | undefined, 
  matchedPath: any,
  route: CoreAPIRoute<unknown, unknown, any>,
  logger: Logger,
  sessionService: SessionService | undefined
) => {
  if (skipUserSession && requiresSession) {
    throw new Error(
      "Can't skip trying to get user session if auth is required"
    )
  }

  if (skipUserSession === false) {
      try {
        if (http?.request) {
          return await getUserSession(
            sessionService,
            requiresSession,
            http.request
          )
        } else if (requiresSession) {
          logger.error({
            action: 'Can only get user session with HTTP request',
            path: matchedPath,
            route,
          })
          throw new Error('Can only get user session with HTTP request')
        }
      } catch (e: any) {
        if (requiresSession) {
          logger.info({
            action: 'Rejecting route (invalid session)',
            path: matchedPath,
            route,
          })
          throw e
        }
      }
    }
    
    return undefined
}

/**
 * @ignore
 */
export const runRoute = async <In, Out>({
  singletonServices,
  request,
  response,
  createSessionServices,
  route: apiRoute,
  method: apiType,
  skipUserSession = false,
  respondWith404 = true,
  logWarningsForStatusCodes = [],
  coerceToArray = false,
}: Pick<CoreAPIRoute<unknown, unknown, any>, 'route' | 'method'> &
  RunRouteOptions &
  RunRouteParams<In>): Promise<Out> => {
  let sessionServices: any | undefined
  const trackerId: string = crypto.randomUUID().toString()
  
  let http: VrameworkHTTPInteraction | undefined
  if (request instanceof VrameworkHTTPRequest && response instanceof VrameworkHTTPResponse) {
    http = { request, response }
  }
  
  try {
    const { matchedPath, params, route, schemaName } = getMatchingRoute(
      singletonServices.logger,
      apiType,
      apiRoute
    )
    const requiresSession = route.auth !== false
    http?.request.setParams(params)
    
    singletonServices.logger.info(
      `Matched route: ${route.route} | method: ${route.method.toUpperCase()} | auth: ${requiresSession.toString()}`
    )

    const session = await loadUserSession(skipUserSession, requiresSession, http, matchedPath, route, singletonServices.logger, singletonServices.sessionService)
    const data = await request.getData()

    if (schemaName) {
      if (coerceToArray) {
        coerceQueryStringToArray(schemaName, data)
      }
      validateJson(schemaName, data)
    }

    sessionServices = await createSessionServices(
      singletonServices,
      { http },
      session
    )
    const allServices = { ...singletonServices, ...sessionServices }

    if (route.permissions) {
      await verifyPermissions(route.permissions, allServices, data, session)
    }

    const result: any = (await route.func(
      allServices,
      data,
      session!
    )) as unknown as Out
    http?.response.setStatus(200)

    if (route.returnsJSON === false) {
      http?.response.setResponse(result)
    } else {
      http?.response.setJson(result)
    }
    return result
  } catch (e: any) {
    if (e instanceof RouteNotFoundError) {
      if (respondWith404) {
        http?.response.setStatus(404)
        http?.response.end()
      }
      throw e
    }

    const errorResponse = getErrorResponse(e)

    if (errorResponse != null) {
      http?.response.setStatus(errorResponse.status)
      http?.response.setJson({
        message: errorResponse.message,
        payload: (e as any).payload,
        traceId: trackerId,
      })

      if (logWarningsForStatusCodes.includes(errorResponse.status)) {
        singletonServices.logger.warn(`Warning id: ${trackerId}`)
        singletonServices.logger.warn(e)
      }
    } else {
      singletonServices.logger.warn(`Error id: ${trackerId}`)
      singletonServices.logger.error(e)
      http?.response.setStatus(500)
      http?.response.setJson({ errorId: trackerId })
    }

    throw e
  } finally {
    await closeServices(singletonServices.logger, sessionServices)
  }
}
