import { getErrorResponse } from './error-handler.js'
import { verifyPermissions } from './permissions.js'
import {
  CoreAPIRoute,
  CoreAPIRoutes,
  RoutesMeta,
} from './types/routes.types.js'
import { loadSchema, validateJson } from './schema.js'
import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from './types/core.types.js'
import { match } from 'path-to-regexp'
import { VrameworkRequest } from './vramework-request.js'
import { VrameworkResponse } from './vramework-response.js'
import { SessionService } from './services/index.js'
import { RouteNotFoundError, NotImplementedError } from './errors.js'
import * as cryptoImp from 'crypto'
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
  respondWith404: boolean,
  logWarningsForStatusCodes: number[]
}>

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
      const schema = routesMeta.find(
        (routeMeta) =>
          routeMeta.method === route.method && routeMeta.route === route.route
      )?.input
      if (schema) {
        loadSchema(schema, logger)
      }
      return { matchedPath, params: matchedPath.params, route, schema }
    }
  }
  logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new RouteNotFoundError()
}

export const getUserSession = async <UserSession extends CoreUserSession>(
  sessionService: SessionService<UserSession> | undefined,
  auth: boolean,
  request: VrameworkRequest
): Promise<CoreUserSession | undefined> => {
  if (sessionService) {
    return (await sessionService.getUserSession(auth, request)) as UserSession
  } else if (auth) {
    throw new NotImplementedError('Session service not implemented')
  }
  return undefined
}

/**
 * @ignore
 */
export const runRoute = async <In, Out>(
  request: VrameworkRequest<In>,
  response: VrameworkResponse,
  services: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >,
  {
    route: apiRoute,
    method: apiType,
    skipUserSession = false,
    respondWith404 = true,
    logWarningsForStatusCodes = [],  
  }: Pick<CoreAPIRoute<unknown, unknown, any>, 'route' | 'method'> &
    RunRouteOptions
): Promise<Out> => {
  let sessionServices: CoreServices | undefined

  try {
    let session: CoreUserSession | undefined

    const { matchedPath, params, route, schema } = getMatchingRoute(
      services.logger,
      apiType,
      apiRoute
    )
    request.setParams(params)
    const requiresSession = route.auth !== false

    services.logger.info(
      `Matched route: ${route.route} | method: ${route.method.toUpperCase()} | auth: ${requiresSession.toString()}`
    )

    if (skipUserSession && requiresSession) {
      throw new Error(
        "Can't skip trying to get user session if auth is required"
      )
    }

    if (skipUserSession === false) {
      try {
        session = await getUserSession(
          services.sessionService,
          requiresSession,
          request
        )
      } catch (e: any) {
        if (requiresSession) {
          services.logger.info({
            action: 'Rejecting route (invalid session)',
            path: matchedPath,
            route,
          })
          throw e
        }
      }
    }

    const data = await request.getData()

    if (schema) {
      validateJson(schema, data)
    }

    const sessionServices = await createSessionServices(
      services,
      { request, response },
      session
    )
    const allServices = { ...services, request, response, ...sessionServices }

    if (route.permissions) {
      await verifyPermissions(route.permissions, allServices, data, session)
    }

    const result: any = (await route.func(
      allServices,
      data,
      session!
    )) as unknown as Out
    response.setStatus(200)

    if (route.returnsJSON === false) {
      response.setResponse(result)
    } else {
      response.setJson(result)
    }
    return result
  } catch (e: any) {
    if (e instanceof RouteNotFoundError) {
      if (respondWith404) {
        response.setStatus(404)
        response.end()
      }
      throw e
    }
 
    const errorResponse = getErrorResponse(e)
    const trackerId: string = e.errorId || crypto.randomUUID().toString()

    if (errorResponse != null) {


      response.setStatus(errorResponse.status)

      response.setJson({
        message: errorResponse.message,
        payload: (e as any).payload,
        traceId: trackerId
      })

      if (logWarningsForStatusCodes.includes(errorResponse.status)) {
        services.logger.warn(`Warning id: ${trackerId}`)
        services.logger.warn(e)
      }
    } else {
      services.logger.warn(`Error id: ${trackerId}`)
      services.logger.error(e)
      response.setStatus(500)
      response.setJson({ errorId: trackerId })
    }

    throw e
  } finally {
    if (sessionServices) {
      await Promise.all(
        Object.values(sessionServices).map(async (service) => {
          if (service?.close) {
            try {
              await service.close()
            } catch (e) {
              services.logger.error(e)
            }
          }
        })
      )
    }
  }
}
