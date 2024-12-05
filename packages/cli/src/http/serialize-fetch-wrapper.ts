export const serializeFetchWrapper = (routesMapPath: string) => {
  return `
import { CoreVrameworkFetch, HTTPMethod } from '@vramework/fetch'
import type { RoutesMap, RouteHandlerOf } from '${routesMapPath}'

export class VrameworkFetch extends CoreVrameworkFetch {
    public async api<
        Route extends keyof RoutesMap,
        Method extends keyof RoutesMap[Route]
    >(route: Route, method: Method, data: RouteHandlerOf<Route, Method>['input'], options?: Omit<RequestInit, 'body'>): Promise<RouteHandlerOf<Route, Method>['output']> {
        return await super.api(route, method as HTTPMethod, data, options)
    }

    public async fetch<
        Route extends keyof RoutesMap,
        Method extends keyof RoutesMap[Route]
    >(route: Route, method: Method, data: RouteHandlerOf<Route, Method>['input'], options?: Omit<RequestInit, 'body'>): Promise<Response> {
        return await super.fetch(route, method as HTTPMethod, data, options)
    }
}

export const vrameworkFetch = new VrameworkFetch()
`
}
