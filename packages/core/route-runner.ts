import { getErrorResponse } from './error-handler'
import { verifyPermissions } from './permissions'
import { CoreAPIRoute, CoreAPIRoutes, RoutesMeta } from './types/routes.types'
import { loadSchema, validateJson } from './schema'
import {
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from './types/core.types'
import { match } from 'path-to-regexp'
import { v4 as uuid } from 'uuid'
import { VrameworkRequest } from './vramework-request'
import { VrameworkResponse } from './vramework-response'
import { SessionService } from './services'
import { NotFoundError, NotImplementedError } from './errors'

type ExtractRouteParams<S extends string> =
  S extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractRouteParams<`/${Rest}`>
  : S extends `${string}:${infer Param}`
  ? Param
  : never;

export type AssertRouteParams<In, Route extends string> =
  ExtractRouteParams<Route> extends keyof In
  ? unknown
  : ['Error: Route parameters', ExtractRouteParams<Route>, 'not in', keyof In];

let routes: CoreAPIRoutes = []
let routesMeta: RoutesMeta = []

export const addCoreRoute = <
  In,
  Out,
  Route extends string,
  APIFunction,
  APIFunctionSessionless,
  APIPermission
>(route: CoreAPIRoute<In, Out, Route, APIFunction, APIFunctionSessionless, APIPermission>) => {
  routes.push(route as any)
}

export const clearRoutes = () => {
  routes = []
}

export const addRouteMeta = (_routeMeta: RoutesMeta) => {
  routesMeta = _routeMeta
}

export const getRoutes = () => {
  return {
    routes,
    routesMeta
  }
}

const getMatchingRoute = (
  logger: CoreSingletonServices['logger'],
  requestType: string,
  requestPath: string
) => {
  for (const route of routes) {
    if (route.method !== requestType.toLowerCase()) {
      continue
    }
    const matchFunc = match(`/${route.route}`.replace(/^\/\//, '/'), {
      decode: decodeURIComponent,
    })
    const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))

    if (matchedPath) {
      const schema = routesMeta.find(routeMeta => routeMeta.method === route.method && routeMeta.route === route.route)?.input
      if (schema) {
        loadSchema(schema, logger)
      }
      return { matchedPath, params: matchedPath.params, route, schema }
    }
  }
  logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new NotFoundError()
}

export const getUserSession = async <UserSession extends CoreUserSession>(
  sessionService: SessionService<UserSession> | undefined,
  auth: boolean,
  request: VrameworkRequest
): Promise<CoreUserSession | undefined> => {
  if (sessionService) {
    return (await sessionService.getUserSession(
      auth,
      request
    )) as UserSession
  } else if (auth) {
    throw new NotImplementedError('Session service not implemented')
  }
  return undefined
}

export const runRoute = async <In, Out>(
  request: VrameworkRequest<In>,
  response: VrameworkResponse,
  services: CoreSingletonServices,
  createSessionServices: CreateSessionServices,
  {
    route: apiRoute,
    method: apiType,
    skipUserSession = false,
  }: Pick<CoreAPIRoute<unknown, unknown, any>, 'route' | 'method'> & { skipUserSession?: boolean },
): Promise<Out> => {
  try {
    let session: CoreUserSession | undefined

    const { matchedPath, params, route, schema } = getMatchingRoute(
      services.logger,
      apiType,
      apiRoute,
    )
    request.setParams(params)

    services.logger.info(`Matched route: ${route.route} | method: ${route.method.toUpperCase()} | auth: ${(!!route.auth).toString()}`)

    if (skipUserSession && route.auth !== false) {
      throw new Error('Can\'t skip trying to get user session if auth is required')
    }

    if (skipUserSession === false) {
      try {
        session = await getUserSession(
          services.sessionService,
          route.auth !== false,
          request
        )
      } catch (e: any) {
        services.logger.info({
          action: 'Rejecting route (invalid session)',
          path: matchedPath,
          route,
        })
        throw e
      }
    }

    const data = await request.getData()

    if (schema) {
      validateJson(schema, data)
    }

    const sessionServices = await createSessionServices(
      {
        ...services,
        request,
        response,
      },
      session
    )

    if (route.permissions) {
      await verifyPermissions(route.permissions, sessionServices, data, session)
    }

    const result: any = (await route.func(
      sessionServices,
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
    const errorId = e.errorId || uuid()
    const errorResponse = getErrorResponse(e)

    if (errorResponse != null) {
      response.setStatus(errorResponse.status)
      response.setJson({
        message: errorResponse.message,
        payload: (e as any).payload,
        errorId,
      })

      services.logger.warn(`Warning id: ${errorId}`)
      services.logger.warn(e)
    } else {
      services.logger.error(e)
      response.setStatus(500)
      response.setJson({ errorId })
    }

    throw e
  }
}
