export const serializeTypedRouteRunner = (routesMapImport: string) => {
  return `/**
* This is used to provide a route runner that is aware of the routes within your application
*/
import { runHTTPRoute, CoreSingletonServices, CreateSessionServices, CoreServices, CoreUserSession, VrameworkHTTPAbstractRequest, VrameworkHTTPAbstractResponse } from '@vramework/core'
import type { RoutesMap, RouteHandlerOf } from '${routesMapImport}'

export const runTypedRoute = async <
  Route extends keyof RoutesMap,
  Method extends keyof RoutesMap[Route]
>(
  request: VrameworkHTTPAbstractRequest<RouteHandlerOf<Route, Method>['input']>,
  response: VrameworkHTTPAbstractResponse,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices,
  route: { route: Route; method: Method }
): Promise<RouteHandlerOf<Route, Method>['output']> => {
  return runHTTPRoute({
    request, 
    response, 
    singletonServices, 
    createSessionServices, 
    ...route as any
  })
};
  `
}
