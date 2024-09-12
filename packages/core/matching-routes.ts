import { NotFoundError } from "./errors"
import { verifyPermissions } from "./permissions"
import { CoreAPIRoute, CoreAPIRoutes } from "./routes"
import { loadSchema, validateJson } from "./schema"
import { CoreSingletonServices, CreateSessionServices, RequestHeaders } from "./types"
// @ts-ignore
import { match } from "path-to-regexp"

export const getMatchingRoute = (
  logger: CoreSingletonServices['logger'],
  requestType: string,
  requestPath: string,
  routes: Array<CoreAPIRoute<unknown, unknown>>,
) => {
  let matchedPath: any | undefined
  for (const route of routes) {
    if (route.type !== requestType.toLowerCase()) {
      continue
    }
    const matchFunc = match(`/${route.route}`.replace(/^\/\//, '/'), { decode: decodeURIComponent })
    matchedPath = matchFunc(requestPath)
    if (matchedPath) {
      if (route.schema) {
        loadSchema(route.schema, logger)
      }
      return { matchedPath, route }
    }
  }
  logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new NotFoundError()
}

export const runRoute = async <Out>(
  services: CoreSingletonServices, 
  createSessionServices: CreateSessionServices, 
  routes: CoreAPIRoutes, 
  { route: apiRoute, type: apiType }: Pick<CoreAPIRoute<unknown, unknown>, 'route' | 'type'>, 
  headers: RequestHeaders, 
  sessionRequestContext: Record<string, any>,
  data: any
): Promise<Out>  => {
  const { matchedPath, route } = getMatchingRoute(services.logger, apiType, apiRoute, routes)
  services.logger.info({ message: 'Executing route', matchedPath, route })
  let session
  
  try {
    session = await services.sessionService?.getUserSession(
      route.requiresSession !== false,
      headers,
    )
  } catch (e: any) {
    services.logger.info({
      action: 'Rejecting route (invalid session)',
      path: matchedPath,
      route,
      headers: headers,
    })
    throw e
  }

  services.logger.info({
    action: 'Executing route',
    path: matchedPath,
    route,
    headers,
  })

  if (route.schema) {
    validateJson(route.schema, data)
  }

  const sessionServices = await createSessionServices(services, session, sessionRequestContext)
  if (route.permissions) {
    await verifyPermissions(route.permissions, sessionServices, data, session)
  }

  return await route.func(sessionServices, data, session) as unknown as Out
}
