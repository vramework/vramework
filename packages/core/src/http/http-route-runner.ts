import { getErrorResponse } from '../errors/error-handler.js'
import { verifyPermissions } from '../permissions.js'
import {
  CoreHTTPFunctionRoute,
  CoreHTTPFunctionRoutes,
  HTTPFunctionsMeta,
  RunRouteOptions,
  RunRouteParams,
} from './http-routes.types.js'
import { loadSchema } from '../schema.js'
import {
  CoreSingletonServices,
  CoreUserSession,
  VrameworkHTTP,
} from '../types/core.types.js'
import { match } from 'path-to-regexp'
import { VrameworkHTTPAbstractRequest } from './vramework-http-abstract-request.js'
import { VrameworkHTTPAbstractResponse } from './vramework-http-abstract-response.js'
import { Logger } from '../services/index.js'
import {
  ForbiddenError,
  NotFoundError,
  NotImplementedError,
} from '../errors/errors.js'
import * as cryptoImp from 'crypto'
import { closeServices, validateAndCoerce } from '../utils.js'
import { CoreAPIChannel } from '../channel/channel.types.js'
import { VrameworkRequest } from '../vramework-request.js'
import { VrameworkResponse } from '../vramework-response.js'
import { HTTPSessionService } from './http-session-service.js'
const crypto = 'default' in cryptoImp ? cryptoImp.default : (cryptoImp as any)

let routes: CoreHTTPFunctionRoutes = []
let routesMeta: HTTPFunctionsMeta = []

export const addRoute = <
  In,
  Out,
  Route extends string,
  APIFunction,
  APIFunctionSessionless,
  APIPermission,
>(
  route: CoreHTTPFunctionRoute<
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
export const setHTTPRoutesMeta = (_routeMeta: HTTPFunctionsMeta) => {
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
  return undefined
}

export const getUserSession = async <UserSession extends CoreUserSession>(
  httpSessionService: HTTPSessionService<UserSession> | undefined,
  auth: boolean,
  request: VrameworkHTTPAbstractRequest
): Promise<CoreUserSession | undefined> => {
  if (httpSessionService) {
    return (await httpSessionService.getUserSession(auth, request)) as UserSession
  } else if (auth) {
    throw new NotImplementedError('Session service not implemented')
  }
  return undefined
}

export const loadUserSession = async (
  skipUserSession: boolean,
  requiresSession: boolean,
  http: VrameworkHTTP | undefined,
  matchedPath: any,
  route:
    | CoreHTTPFunctionRoute<unknown, unknown, any>
    | CoreAPIChannel<unknown, any>,
  logger: Logger,
  httpSessionService: HTTPSessionService | undefined
) => {
  if (skipUserSession && requiresSession) {
    throw new Error("Can't skip trying to get user session if auth is required")
  }

  if (skipUserSession === false) {
    try {
      if (http?.request) {
        return await getUserSession(
          httpSessionService,
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

export const createHTTPInteraction = (
  request: VrameworkRequest | undefined,
  response: VrameworkResponse | undefined
) => {
  let http: VrameworkHTTP | undefined = undefined
  if (
    request instanceof VrameworkHTTPAbstractRequest ||
    response instanceof VrameworkHTTPAbstractResponse
  ) {
    http = {}
    if (request instanceof VrameworkHTTPAbstractRequest) {
      http.request = request
    }
    if (response instanceof VrameworkHTTPAbstractResponse) {
      http.response = response
    }
  }
  return http
}

export const handleError = (
  e: any,
  http: VrameworkHTTP | undefined,
  trackerId: string,
  logger: Logger,
  logWarningsForStatusCodes: number[]
) => {
  const errorResponse = getErrorResponse(e)

  if (errorResponse != null) {
    http?.response?.setStatus(errorResponse.status)
    http?.response?.setJson({
      message: errorResponse.message,
      payload: (e as any).payload,
      traceId: trackerId,
    })

    if (logWarningsForStatusCodes.includes(errorResponse.status)) {
      logger.warn(`Warning id: ${trackerId}`)
      logger.warn(e)
    }
  } else {
    logger.warn(`Error id: ${trackerId}`)
    logger.error(e)
    http?.response?.setStatus(500)
    http?.response?.setJson({ errorId: trackerId })
  }
}

/**
 * @ignore
 */
export const runHTTPRoute = async <In, Out>({
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
}: Pick<CoreHTTPFunctionRoute<unknown, unknown, any>, 'route' | 'method'> &
  RunRouteOptions &
  RunRouteParams<In>): Promise<Out> => {
  let sessionServices: any | undefined
  const trackerId: string = crypto.randomUUID().toString()

  const http = createHTTPInteraction(request, response)

  const matchedRoute = getMatchingRoute(
    singletonServices.logger,
    apiType,
    apiRoute
  )

  if (!matchedRoute) {
    if (respondWith404) {
      http?.response?.setStatus(404)
      http?.response?.end()
    }
    singletonServices.logger.info({
      message: 'Invalid route',
      apiRoute,
      apiType,
    })
    throw new NotFoundError(`Route not found: ${apiRoute}`)
  }

  try {
    const { matchedPath, params, route, schemaName } = matchedRoute
    const requiresSession = route.auth !== false
    http?.request?.setParams(params)

    singletonServices.logger.info(
      `Matched route: ${route.route} | method: ${route.method.toUpperCase()} | auth: ${requiresSession.toString()}`
    )

    const session = await loadUserSession(
      skipUserSession,
      requiresSession,
      http,
      matchedPath,
      route,
      singletonServices.logger,
      singletonServices.httpSessionService
    )
    const data = await request.getData()

    validateAndCoerce(singletonServices.logger, schemaName, data, coerceToArray)

    sessionServices = await createSessionServices(
      singletonServices,
      { http },
      session
    )
    const allServices = { ...singletonServices, ...sessionServices, http }

    if (singletonServices.httpPermissionService) {
      await singletonServices.httpPermissionService.verifyRouteAccess(route, session)
    }

    const permissioned = await verifyPermissions(
      route.permissions,
      allServices,
      data,
      session
    )
    if (permissioned === false) {
      throw new ForbiddenError('Permission denied')
    }

    const result: any = (await route.func(
      allServices,
      data,
      session!
    )) as unknown as Out

    if (route.returnsJSON === false) {
      http?.response?.setResponse(result)
    } else {
      http?.response?.setJson(result)
    }
    http?.response?.setStatus(200)
    http?.response?.end()

    return result
  } catch (e: any) {
    handleError(
      e,
      http,
      trackerId,
      singletonServices.logger,
      logWarningsForStatusCodes
    )
    throw e
  } finally {
    await closeServices(singletonServices.logger, sessionServices)
  }
}
