export const serializeTypedRouteRunner = (routesMapImport: string) => {
  return `/**
* This is used to provide a route runner that is aware of the routes within your application
*/
import { runRoute, CoreSingletonServices, CreateSessionServices, CoreServices, CoreUserSession, VrameworkRequest, VrameworkResponse } from '@vramework/core'
import type { RoutesMap, RouteHandlerOf } from '${routesMapImport}'

export const runTypedRoute = async <
  Route extends keyof RoutesMap,
  Method extends keyof RoutesMap[Route]
>(
  request: VrameworkRequest<RouteHandlerOf<Route, Method>['input']>,
  response: VrameworkResponse,
  services: CoreSingletonServices,
  createSessionServices: CreateSessionServices<CoreSingletonServices, CoreUserSession, CoreServices>,
  route: { route: Route; method: Method }
): Promise<RouteHandlerOf<Route, Method>['output']> => {
  return runRoute(request, response, services, createSessionServices, route as any)
};
  `
}
