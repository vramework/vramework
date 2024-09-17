import { getErrorResponse, NotFoundError, NotImplementedError } from "./errors"
import { verifyPermissions } from "./permissions"
import { CoreAPIRoute, CoreAPIRoutes } from "./routes"
import { loadSchema, validateJson } from "./schema"
import { CoreSingletonServices, CoreUserSession, CreateSessionServices, RequestHeaders, SessionService } from "./types"
import { match } from "path-to-regexp"
import { v4 as uuid } from 'uuid'
import { VrameworkRequest } from "./vramework-request"
import { VrameworkResponse } from "./vramework-response"

const getMatchingRoute = (
  logger: CoreSingletonServices['logger'],
  requestType: string,
  requestPath: string,
  routes: Array<CoreAPIRoute<unknown, unknown>>,
) => {
  for (const route of routes) {
    if (route.type !== requestType.toLowerCase()) {
      continue
    }
    const matchFunc = match(`/${route.route}`.replace(/^\/\//, '/'), { decode: decodeURIComponent })
    const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))

    if (matchedPath) {
      if (route.schema) {
        loadSchema(route.schema, logger)
      }
      return { matchedPath, params: matchedPath.params, route }
    }
  }
  logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new NotFoundError()
}

export const getUserSession = async <UserSession extends CoreUserSession>(sessionService: SessionService<UserSession> | undefined, requiresSession: boolean, request: VrameworkRequest): Promise<CoreUserSession | undefined> => {
  if (sessionService) {
    return await sessionService.getUserSession(
      requiresSession,
      request
    ) as UserSession
  } else if (requiresSession) {
    throw new NotImplementedError('Session service not implemented')
  }
}

export const runRoute = async <In, Out>(
  request: VrameworkRequest<In>,
  response: VrameworkResponse,
  services: CoreSingletonServices,
  createSessionServices: CreateSessionServices,
  routes: CoreAPIRoutes,
  { route: apiRoute, type: apiType }: Pick<CoreAPIRoute<unknown, unknown>, 'route' | 'type'>,
): Promise<Out> => {
  try {
    let session

    const { matchedPath, params, route } = getMatchingRoute(services.logger, apiType, apiRoute, routes)
    request.setParams(params)
    
    services.logger.info({ 
      message: 'Matched route', 
      matchedPath, 
      route 
    })

    try {
      session = await getUserSession(services.sessionService, route.requiresSession !== false, request)
    } catch (e: any) {
      services.logger.info({
        action: 'Rejecting route (invalid session)',
        path: matchedPath,
        route,
      })
      throw e
    }

    const data = await request.getData(request.getHeader('Content-Type') || 'application/json')
    if (route.schema) {
      validateJson(route.schema, data)
    }

    const sessionServices = await createSessionServices({
      ...services,
      request,
      response
    }, session)
    if (route.permissions) {
      await verifyPermissions(route.permissions, sessionServices, data, session)
    }

    const result: any = await route.func(sessionServices, data, session) as unknown as Out
    response.setStatus(200)
    if (route.returnsJSON) {
      response.setJson(result)
    } else {
      response.setResponse(result)
    }
    return result
  } catch (e: any) {
    const errorId = e.errorId || uuid()
    const errorResponse = getErrorResponse(e)

    if (errorResponse != null) {
      response.setStatus(errorResponse.status)
      response.setJson({ message: errorResponse.message, payload: (e as any).payload, errorId })

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