export const serializeFetchWrapper = (routesMapPath: string) => {
  return `import { CoreVrameworkFetch, CoreVrameworkFetchOptions } from '@vramework/fetch'

import type { RoutesMap, RouteHandlerOf } from '${routesMapPath}'

export class VrameworkFetch {
    private client: CoreVrameworkFetch;
    constructor(options?: CoreVrameworkFetchOptions) {
        this.client = new CoreVrameworkFetch(options)
    }

    public setServerUrl(serverUrl: string): void {
        this.client.setServerUrl(serverUrl)
    }

    public setAuthorizationJWT(jwt: string): void {
        this.client.setAuthorizationJWT(jwt)
    }

    public setAPIKey(apiKey?: string): void {
        this.client.setAPIKey(apiKey)
    }

    public async api<
        Route extends keyof RoutesMap,
        Method extends keyof RoutesMap[Route]
    >(route: Route, method: Method, data: RouteHandlerOf<Route, Method>['input'], options?: Omit<RequestInit, 'body'>): Promise<RouteHandlerOf<Route, Method>['output']> {
        // Using patch lower case seems to not work sometimes in certain tests
        // But uppercasing does
        return this.client.api(route, (method.toString()).toUpperCase() as any, data, options)
    }

    public async fetch<
        Route extends keyof RoutesMap,
        Method extends keyof RoutesMap[Route]
    >(route: Route, method: Method, data: RouteHandlerOf<Route, Method>['input'], options?: Omit<RequestInit, 'body'>): Promise<Response> {
        return this.client.fetch(route, (method.toString()).toUpperCase() as any, data, options)
    }
}

export const vrameworkFetch = new VrameworkFetch()
`
}